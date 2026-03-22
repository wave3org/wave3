import { NextRequest, NextResponse } from "next/server";
import {
	Address,
	Hex,
	createPublicClient,
	createWalletClient,
	getAddress,
	http,
	isAddress,
	isHex,
	toFunctionSelector,
	verifyTypedData,
	zeroAddress
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat, sepolia } from "viem/chains";
import deployedContracts from "~~/contracts/deployedContracts";
import { WAVE3_SMART_ACCOUNT_ABI, WAVE3_SMART_ACCOUNT_FACTORY_ABI } from "~~/services/web3/smartAccount";

const SUPPORTED_CHAINS = {
	[hardhat.id]: hardhat,
	[sepolia.id]: sepolia
} as const;

const CREATE_ACCOUNT_TYPES = {
	CreateAccount: [
		{ name: "owner", type: "address" },
		{ name: "deadline", type: "uint256" }
	]
} as const;

const CREATE_ACCOUNT_DOMAIN = {
	name: "Wave3SmartAccountFactory",
	version: "1"
} as const;

const SMART_ACCOUNT_OWNER_ABI = [
	{
		type: "function",
		stateMutability: "view",
		name: "owner",
		inputs: [],
		outputs: [{ name: "", type: "address", internalType: "address" }]
	}
] as const;

const SELECTORS = {
	wavecoinApprove: toFunctionSelector("approve(address,uint256)"),
	wavecoinMint: toFunctionSelector("mint(uint256)"),
	songRoyaltiesPlaySong: toFunctionSelector("playSong(uint256)"),
	songRoyaltiesWithdrawRoyalties: toFunctionSelector("withdrawRoyalties(uint256)"),
	songRoyaltiesBuyShares: toFunctionSelector("buyShares(uint256,address,uint256)"),
	albumsAddAlbum: toFunctionSelector("addAlbum(string,string)"),
	songsAddSong: toFunctionSelector("addSong(string,string,uint256)"),
	songsSetApprovalForAll: toFunctionSelector("setApprovalForAll(address,bool)")
} as const;

const PLAY_SONG_SELECTOR = SELECTORS.songRoyaltiesPlaySong;

type RelayAction = "createAccount" | "execute" | "authorizeSessionKey" | "executeSession";

const DEFAULT_DAILY_QUOTAS: Record<RelayAction, number> = {
	createAccount: 3,
	execute: 250,
	authorizeSessionKey: 20,
	executeSession: 1500
};

const DAILY_QUOTA_ENV: Record<RelayAction, string> = {
	createAccount: "SMART_ACCOUNT_MAX_CREATE_PER_DAY",
	execute: "SMART_ACCOUNT_MAX_EXECUTE_PER_DAY",
	authorizeSessionKey: "SMART_ACCOUNT_MAX_AUTHORIZE_SESSION_PER_DAY",
	executeSession: "SMART_ACCOUNT_MAX_SESSION_EXECUTE_PER_DAY"
};

type QuotaBucket = {
	day: string;
	counts: Record<RelayAction, number>;
};

const relayQuotasByOwner = new Map<string, QuotaBucket>();

type RelayCreateAccountRequest = {
	action: "createAccount";
	chainId: number;
	owner: string;
	deadline: string;
	signature: string;
};

type RelayExecuteRequest = {
	action: "execute";
	chainId: number;
	smartAccount: string;
	target: string;
	data: string;
	value: string;
	deadline: string;
	signature: string;
};

type RelayAuthorizeSessionKeyRequest = {
	action: "authorizeSessionKey";
	chainId: number;
	smartAccount: string;
	sessionKey: string;
	target: string;
	selector: string;
	validUntil: string;
	maxCalls: number;
	deadline: string;
	signature: string;
};

type RelayExecuteSessionRequest = {
	action: "executeSession";
	chainId: number;
	smartAccount: string;
	sessionKey: string;
	target: string;
	data: string;
	value: string;
	deadline: string;
	signature: string;
};

type RelayRequestBody =
	| RelayCreateAccountRequest
	| RelayExecuteRequest
	| RelayAuthorizeSessionKeyRequest
	| RelayExecuteSessionRequest;

const getRpcUrl = (chainId: number) => {
	const genericRpc = process.env.SMART_ACCOUNT_RPC_URL;
	if (genericRpc) {
		return genericRpc;
	}

	if (chainId === hardhat.id) {
		return process.env.SMART_ACCOUNT_RPC_URL_HARDHAT || "http://127.0.0.1:8545";
	}

	if (chainId === sepolia.id) {
		if (process.env.SMART_ACCOUNT_RPC_URL_SEPOLIA) {
			return process.env.SMART_ACCOUNT_RPC_URL_SEPOLIA;
		}
		const alchemyApiKey =
			process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || "cR4WnXePioePZ5fFrnSiR";
		return `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
	}

	throw new Error(`Unsupported chain for sponsored tx: ${chainId}`);
};

const getChainContracts = (chainId: number) => {
	return (deployedContracts as Record<number, Record<string, { address: Address }>>)[chainId];
};

const getFactoryAddress = (chainId: number): Address => {
	const envFactory = process.env.NEXT_PUBLIC_SMART_ACCOUNT_FACTORY_ADDRESS;
	if (envFactory && isAddress(envFactory)) {
		return getAddress(envFactory);
	}

	const chainContracts = getChainContracts(chainId);
	const deployedFactory = chainContracts?.Wave3SmartAccountFactory?.address;
	if (!deployedFactory) {
		throw new Error("Wave3SmartAccountFactory address is not configured");
	}

	return deployedFactory;
};

const getSongRoyaltiesAddress = (chainId: number): Address | undefined => {
	const chainContracts = getChainContracts(chainId);
	return chainContracts?.SongRoyalties?.address;
};

const getSponsoredSelectorsByTarget = (chainId: number) => {
	const policies = new Map<string, Set<string>>();
	const chainContracts = getChainContracts(chainId);

	if (!chainContracts) {
		return policies;
	}

	const addPolicy = (contractName: string, selectors: Hex[]) => {
		const contractAddress = chainContracts[contractName]?.address;
		if (!contractAddress) {
			return;
		}

		const key = contractAddress.toLowerCase();
		const existing = policies.get(key) ?? new Set<string>();
		selectors.forEach(selector => existing.add(selector.toLowerCase()));
		policies.set(key, existing);
	};

	addPolicy("Wavecoin", [SELECTORS.wavecoinApprove]);
	if (chainId === hardhat.id || process.env.SMART_ACCOUNT_ALLOW_WAVECOIN_MINT === "true") {
		addPolicy("Wavecoin", [SELECTORS.wavecoinMint]);
	}

	addPolicy("SongRoyalties", [
		SELECTORS.songRoyaltiesPlaySong,
		SELECTORS.songRoyaltiesWithdrawRoyalties,
		SELECTORS.songRoyaltiesBuyShares
	]);
	addPolicy("Albums", [SELECTORS.albumsAddAlbum]);
	addPolicy("Songs", [SELECTORS.songsAddSong, SELECTORS.songsSetApprovalForAll]);

	return policies;
};

const extractSelector = (calldata: Hex): Hex | undefined => {
	if (calldata.length < 10) {
		return undefined;
	}

	return calldata.slice(0, 10) as Hex;
};

const isSponsoredCallAllowed = (chainId: number, target: Address, selector: Hex) => {
	const policies = getSponsoredSelectorsByTarget(chainId);
	const selectors = policies.get(target.toLowerCase());
	if (!selectors) {
		return false;
	}

	return selectors.has(selector.toLowerCase());
};

const isValidPlaybackSessionTarget = (chainId: number, target: Address, selector: string) => {
	const royaltiesAddress = getSongRoyaltiesAddress(chainId);
	if (!royaltiesAddress) {
		return false;
	}
	return (
		target.toLowerCase() === royaltiesAddress.toLowerCase() &&
		selector.toLowerCase() === PLAY_SONG_SELECTOR.toLowerCase()
	);
};

const getClients = (chainId: number) => {
	const chain = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
	if (!chain) {
		throw new Error(`Unsupported chain: ${chainId}`);
	}

	const relayerPk = process.env.SMART_ACCOUNT_RELAYER_PRIVATE_KEY;
	if (!relayerPk || !isHex(relayerPk)) {
		throw new Error("SMART_ACCOUNT_RELAYER_PRIVATE_KEY is missing or invalid");
	}

	const account = privateKeyToAccount(relayerPk as Hex);
	const transport = http(getRpcUrl(chainId));

	const publicClient = createPublicClient({
		chain,
		transport
	});

	const walletClient = createWalletClient({
		chain,
		transport,
		account
	});

	return {
		account,
		publicClient,
		walletClient
	};
};

const parsePositiveInt = (value: string): number | undefined => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return undefined;
	}
	if (!Number.isInteger(parsed)) {
		return undefined;
	}
	return parsed;
};

const parseBigIntValue = (value: string): bigint | undefined => {
	try {
		return BigInt(value);
	} catch {
		return undefined;
	}
};

const nowInSeconds = () => BigInt(Math.floor(Date.now() / 1000));

const getDailyQuotaLimit = (action: RelayAction) => {
	const envValue = process.env[DAILY_QUOTA_ENV[action]];
	if (!envValue || envValue.trim() === "") {
		return DEFAULT_DAILY_QUOTAS[action];
	}

	const parsed = parsePositiveInt(envValue);
	if (parsed === undefined) {
		return DEFAULT_DAILY_QUOTAS[action];
	}

	return parsed;
};

const consumeDailyQuota = ({ chainId, owner, action }: { chainId: number; owner: Address; action: RelayAction }) => {
	const limit = getDailyQuotaLimit(action);
	if (limit <= 0) {
		return true;
	}

	const day = new Date().toISOString().slice(0, 10);
	const key = `${chainId}:${owner.toLowerCase()}`;
	const currentBucket = relayQuotasByOwner.get(key);
	const bucket: QuotaBucket =
		currentBucket && currentBucket.day === day
			? currentBucket
			: {
					day,
					counts: {
						createAccount: 0,
						execute: 0,
						authorizeSessionKey: 0,
						executeSession: 0
					}
				};

	const currentCount = bucket.counts[action];
	if (currentCount >= limit) {
		return false;
	}

	bucket.counts[action] = currentCount + 1;
	relayQuotasByOwner.set(key, bucket);
	return true;
};

const verifyCreateAccountSignature = async ({
	owner,
	chainId,
	factoryAddress,
	deadline,
	signature
}: {
	owner: Address;
	chainId: number;
	factoryAddress: Address;
	deadline: bigint;
	signature: Hex;
}) => {
	return verifyTypedData({
		address: owner,
		domain: {
			...CREATE_ACCOUNT_DOMAIN,
			chainId,
			verifyingContract: factoryAddress
		},
		types: CREATE_ACCOUNT_TYPES,
		primaryType: "CreateAccount",
		message: {
			owner,
			deadline
		},
		signature
	});
};

const resolveSmartAccountOwner = async ({
	publicClient,
	smartAccount
}: {
	publicClient: ReturnType<typeof createPublicClient>;
	smartAccount: Address;
}): Promise<Address | undefined> => {
	try {
		const owner = await publicClient.readContract({
			address: smartAccount,
			abi: SMART_ACCOUNT_OWNER_ABI,
			functionName: "owner"
		});

		if (!owner || !isAddress(owner)) {
			return undefined;
		}

		return getAddress(owner);
	} catch {
		return undefined;
	}
};

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as RelayRequestBody;
		const chainId = Number(body.chainId);
		const { publicClient, walletClient, account } = getClients(chainId);
		const factoryAddress = getFactoryAddress(chainId);

		if (body.action === "createAccount") {
			if (!isAddress(body.owner)) {
				return NextResponse.json({ error: "Invalid owner address" }, { status: 400 });
			}
			if (!isHex(body.signature)) {
				return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
			}

			const owner = getAddress(body.owner);
			const deadline = parseBigIntValue(body.deadline);
			if (deadline === undefined) {
				return NextResponse.json({ error: "Invalid deadline value" }, { status: 400 });
			}
			if (nowInSeconds() > deadline) {
				return NextResponse.json({ error: "Create account signature expired" }, { status: 400 });
			}

			const isValidSignature = await verifyCreateAccountSignature({
				owner,
				chainId,
				factoryAddress,
				deadline,
				signature: body.signature as Hex
			});
			if (!isValidSignature) {
				return NextResponse.json({ error: "Invalid create account signature" }, { status: 401 });
			}

			const existingAccount = await publicClient.readContract({
				address: factoryAddress,
				abi: WAVE3_SMART_ACCOUNT_FACTORY_ABI,
				functionName: "getAccount",
				args: [owner]
			});

			if (existingAccount && existingAccount !== zeroAddress) {
				return NextResponse.json({
					smartAccount: existingAccount,
					created: false
				});
			}

			if (!consumeDailyQuota({ chainId, owner, action: "createAccount" })) {
				return NextResponse.json({ error: "Daily createAccount sponsorship quota exceeded" }, { status: 429 });
			}

			// Get current gas prices from the network
			const feeData = await publicClient.estimateFeesPerGas();

			const txHash = await walletClient.writeContract({
				account,
				address: factoryAddress,
				abi: WAVE3_SMART_ACCOUNT_FACTORY_ABI,
				functionName: "createAccount",
				args: [owner],
				maxFeePerGas: feeData.maxFeePerGas,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
			});
			await publicClient.waitForTransactionReceipt({ hash: txHash });

			const smartAccount = await publicClient.readContract({
				address: factoryAddress,
				abi: WAVE3_SMART_ACCOUNT_FACTORY_ABI,
				functionName: "getAccount",
				args: [owner]
			});

			if (!smartAccount || smartAccount === zeroAddress) {
				throw new Error("Smart account creation failed");
			}

			return NextResponse.json({
				txHash,
				smartAccount,
				created: true
			});
		}

		if (body.action === "execute") {
			if (!isAddress(body.smartAccount) || !isAddress(body.target)) {
				return NextResponse.json({ error: "Invalid smart account or target address" }, { status: 400 });
			}

			if (!isHex(body.data) || !isHex(body.signature)) {
				return NextResponse.json({ error: "Invalid calldata or signature format" }, { status: 400 });
			}

			const smartAccount = getAddress(body.smartAccount);
			const target = getAddress(body.target);
			const value = parseBigIntValue(body.value);
			const deadline = parseBigIntValue(body.deadline);
			if (value === undefined || deadline === undefined) {
				return NextResponse.json({ error: "Invalid value or deadline format" }, { status: 400 });
			}

			if (value !== 0n) {
				return NextResponse.json({ error: "Sponsored calls with value are not allowed" }, { status: 400 });
			}

			const selector = extractSelector(body.data as Hex);
			if (!selector) {
				return NextResponse.json({ error: "Calldata must include a function selector" }, { status: 400 });
			}
			if (!isSponsoredCallAllowed(chainId, target, selector)) {
				return NextResponse.json({ error: "Target function is not allowed for sponsorship" }, { status: 403 });
			}

			const owner = await resolveSmartAccountOwner({ publicClient, smartAccount });
			if (!owner) {
				return NextResponse.json({ error: "Could not resolve smart account owner" }, { status: 400 });
			}
			if (!consumeDailyQuota({ chainId, owner, action: "execute" })) {
				return NextResponse.json({ error: "Daily execute sponsorship quota exceeded" }, { status: 429 });
			}

			// Get current gas prices from the network
			const feeData = await publicClient.estimateFeesPerGas();

			const txHash = await walletClient.writeContract({
				account,
				address: smartAccount,
				abi: WAVE3_SMART_ACCOUNT_ABI,
				functionName: "execute",
				args: [target, value, body.data, deadline, body.signature],
				maxFeePerGas: feeData.maxFeePerGas,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
			});

			return NextResponse.json({ txHash });
		}

		if (body.action === "authorizeSessionKey") {
			if (!isAddress(body.smartAccount) || !isAddress(body.sessionKey) || !isAddress(body.target)) {
				return NextResponse.json({ error: "Invalid smart account, session key or target address" }, { status: 400 });
			}
			if (!isHex(body.signature) || !/^0x[a-fA-F0-9]{8}$/.test(body.selector)) {
				return NextResponse.json({ error: "Invalid signature or selector format" }, { status: 400 });
			}

			const smartAccount = getAddress(body.smartAccount);
			const sessionKey = getAddress(body.sessionKey);
			const target = getAddress(body.target);
			const validUntil = parseBigIntValue(body.validUntil);
			const maxCalls = Number(body.maxCalls);
			const deadline = parseBigIntValue(body.deadline);
			const selector = body.selector as Hex;
			if (validUntil === undefined || deadline === undefined) {
				return NextResponse.json({ error: "Invalid validUntil or deadline format" }, { status: 400 });
			}
			if (!Number.isInteger(maxCalls)) {
				return NextResponse.json({ error: "maxCalls must be an integer" }, { status: 400 });
			}

			if (!isSponsoredCallAllowed(chainId, target, selector)) {
				return NextResponse.json({ error: "Target function is not allowed for sponsorship" }, { status: 403 });
			}
			if (!isValidPlaybackSessionTarget(chainId, target, selector)) {
				return NextResponse.json(
					{ error: "Session key can only be authorized for SongRoyalties.playSong" },
					{ status: 403 }
				);
			}
			if (maxCalls <= 0) {
				return NextResponse.json({ error: "maxCalls must be greater than 0" }, { status: 400 });
			}

			const owner = await resolveSmartAccountOwner({ publicClient, smartAccount });
			if (!owner) {
				return NextResponse.json({ error: "Could not resolve smart account owner" }, { status: 400 });
			}
			if (!consumeDailyQuota({ chainId, owner, action: "authorizeSessionKey" })) {
				return NextResponse.json({ error: "Daily authorizeSessionKey sponsorship quota exceeded" }, { status: 429 });
			}

			// Get current gas prices from the network
			const feeData = await publicClient.estimateFeesPerGas();

			const txHash = await walletClient.writeContract({
				account,
				address: smartAccount,
				abi: WAVE3_SMART_ACCOUNT_ABI,
				functionName: "authorizeSessionKey",
				args: [sessionKey, target, selector, validUntil, maxCalls, deadline, body.signature],
				maxFeePerGas: feeData.maxFeePerGas,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
			});
			await publicClient.waitForTransactionReceipt({ hash: txHash });

			return NextResponse.json({ txHash });
		}

		if (body.action === "executeSession") {
			if (!isAddress(body.smartAccount) || !isAddress(body.sessionKey) || !isAddress(body.target)) {
				return NextResponse.json({ error: "Invalid smart account, session key or target address" }, { status: 400 });
			}
			if (!isHex(body.data) || !isHex(body.signature)) {
				return NextResponse.json({ error: "Invalid calldata or signature format" }, { status: 400 });
			}

			const smartAccount = getAddress(body.smartAccount);
			const sessionKey = getAddress(body.sessionKey);
			const target = getAddress(body.target);
			const value = parseBigIntValue(body.value);
			const deadline = parseBigIntValue(body.deadline);
			if (value === undefined || deadline === undefined) {
				return NextResponse.json({ error: "Invalid value or deadline format" }, { status: 400 });
			}

			if (value !== 0n) {
				return NextResponse.json({ error: "Session calls with value are not allowed" }, { status: 400 });
			}

			const selector = extractSelector(body.data as Hex);
			if (!selector) {
				return NextResponse.json({ error: "Calldata must include a function selector" }, { status: 400 });
			}
			if (!isSponsoredCallAllowed(chainId, target, selector)) {
				return NextResponse.json({ error: "Target function is not allowed for sponsorship" }, { status: 403 });
			}
			if (!isValidPlaybackSessionTarget(chainId, target, selector)) {
				return NextResponse.json(
					{ error: "Session execution is restricted to SongRoyalties.playSong" },
					{ status: 403 }
				);
			}

			const owner = await resolveSmartAccountOwner({ publicClient, smartAccount });
			if (!owner) {
				return NextResponse.json({ error: "Could not resolve smart account owner" }, { status: 400 });
			}
			if (!consumeDailyQuota({ chainId, owner, action: "executeSession" })) {
				return NextResponse.json({ error: "Daily executeSession sponsorship quota exceeded" }, { status: 429 });
			}

			// Get current gas prices from the network
			const feeData = await publicClient.estimateFeesPerGas();

			const txHash = await walletClient.writeContract({
				account,
				address: smartAccount,
				abi: WAVE3_SMART_ACCOUNT_ABI,
				functionName: "executeSession",
				args: [sessionKey, target, value, body.data, deadline, body.signature],
				maxFeePerGas: feeData.maxFeePerGas,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
			});

			return NextResponse.json({ txHash });
		}

		return NextResponse.json({ error: "Invalid relay action" }, { status: 400 });
	} catch (error: any) {
		return NextResponse.json(
			{
				error: error?.message || "Relay request failed"
			},
			{ status: 500 }
		);
	}
}
