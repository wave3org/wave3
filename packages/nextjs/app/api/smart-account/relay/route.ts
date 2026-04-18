import { NextRequest, NextResponse } from "next/server";
import { type Address, type Hex, createPublicClient, createWalletClient, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import {
	type SmartAccountAuthorizeSessionRequest,
	type SmartAccountEnsureRequest,
	type SmartAccountExecuteRequest,
	type SmartAccountExecuteSessionRequest,
	WAVECOIN_BUY_PLAY_SELECTOR,
	wave3SmartAccountAbi,
	wave3SmartAccountFactoryAbi
} from "~~/services/web3/smartAccount";
import type { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_HARDHAT_RELAYER_PRIVATE_KEY = "0x59c6995e998f97a5a0044976f0945385d2f5351b8d5dbff7f7f0f63a2694c5a1";
const deployedContractsByChain = deployedContracts as GenericContractsDeclaration;

const logRelay = (event: string, details?: Record<string, unknown>) => {
	console.info("[Wave3][relay]", event, details ?? {});
};

const maskPrivateKey = (privateKey: Hex) => `${privateKey.slice(0, 8)}...${privateKey.slice(-6)}`;

const getChainConfig = (chainId: number) => {
	const chain = scaffoldConfig.targetNetworks.find(targetChain => targetChain.id === chainId);
	if (!chain) {
		throw new Error(`Unsupported chain id ${chainId}`);
	}

	const rpcOverrides = scaffoldConfig.rpcOverrides as Record<number, string> | undefined;
	const rpcUrl = rpcOverrides?.[chainId] || chain.rpcUrls.default.http[0];
	if (!rpcUrl) {
		throw new Error(`Missing RPC URL for chain ${chainId}`);
	}

	return { chain, rpcUrl };
};

const getFactoryAddress = (chainId: number) => {
	const chainContracts = deployedContractsByChain[chainId];
	const address = chainContracts?.Wave3SmartAccountFactory?.address;
	if (!address || !isAddress(address)) {
		throw new Error(`Wave3SmartAccountFactory is not configured for chain ${chainId}`);
	}

	return address as Address;
};

const getRelayerAccount = (chainId: number) => {
	const envPrivateKey = process.env.SMART_ACCOUNT_RELAYER_PRIVATE_KEY as Hex | undefined;
	const privateKey = envPrivateKey || (chainId === 31337 ? (DEFAULT_HARDHAT_RELAYER_PRIVATE_KEY as Hex) : undefined);
	if (!privateKey) {
		throw new Error("SMART_ACCOUNT_RELAYER_PRIVATE_KEY is not configured");
	}

	const relayerAccount = privateKeyToAccount(privateKey);
	logRelay("relayer_account_selected", {
		chainId,
		source: envPrivateKey ? "env" : "hardhat-default-fallback",
		relayerAddress: relayerAccount.address,
		privateKeyPreview: maskPrivateKey(privateKey)
	});

	return relayerAccount;
};

const getClients = (chainId: number) => {
	const { chain, rpcUrl } = getChainConfig(chainId);
	const relayerAccount = getRelayerAccount(chainId);
	const publicClient = createPublicClient({
		chain,
		transport: http(rpcUrl)
	});
	const walletClient = createWalletClient({
		account: relayerAccount,
		chain,
		transport: http(rpcUrl)
	});

	return { chain, rpcUrl, relayerAccount, publicClient, walletClient };
};

const getWavecoinAddress = (chainId: number) => {
	const chainContracts = deployedContractsByChain[chainId];
	const wavecoinAddress = chainContracts?.Wavecoin?.address;

	if (!wavecoinAddress || !isAddress(wavecoinAddress)) {
		throw new Error(`Wavecoin is not configured for chain ${chainId}`);
	}

	return wavecoinAddress as Address;
};

const ensureAccount = async ({ ownerAddress, chainId }: { ownerAddress: Address; chainId: number }) => {
	const { publicClient, walletClient, relayerAccount } = getClients(chainId);
	const factoryAddress = getFactoryAddress(chainId);

	let smartAccountAddress = await publicClient.readContract({
		address: factoryAddress,
		abi: wave3SmartAccountFactoryAbi,
		functionName: "getAccount",
		args: [ownerAddress]
	});

	if (smartAccountAddress === ZERO_ADDRESS) {
		logRelay("creating_smart_account", { ownerAddress, chainId, factoryAddress });
		const createHash = await walletClient.writeContract({
			address: factoryAddress,
			abi: wave3SmartAccountFactoryAbi,
			functionName: "createAccount",
			args: [ownerAddress],
			account: relayerAccount
		});

		await publicClient.waitForTransactionReceipt({ hash: createHash });
		logRelay("smart_account_created", { ownerAddress, chainId, createHash });

		smartAccountAddress = await publicClient.readContract({
			address: factoryAddress,
			abi: wave3SmartAccountFactoryAbi,
			functionName: "getAccount",
			args: [ownerAddress]
		});
	}

	return { smartAccountAddress, publicClient, walletClient, relayerAccount };
};

const validateSponsoredCall = ({
	target,
	chainId,
	value,
	data
}: {
	target: Address;
	chainId: number;
	value: string;
	data: Hex;
}) => {
	if (!isAddress(target)) {
		throw new Error("Invalid target");
	}
	if (target.toLowerCase() !== getWavecoinAddress(chainId).toLowerCase()) {
		throw new Error("Only the configured Wavecoin contract can be sponsored");
	}
	if (value !== "0") {
		throw new Error("Sponsored calls only support value=0");
	}
	if (!data.startsWith(WAVECOIN_BUY_PLAY_SELECTOR)) {
		throw new Error("Only Wavecoin.buyPlayFor(uint256,address) is allowed");
	}
};

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as
			| SmartAccountEnsureRequest
			| SmartAccountExecuteRequest
			| SmartAccountAuthorizeSessionRequest
			| SmartAccountExecuteSessionRequest;

		logRelay("request_received", {
			action: body.action,
			chainId: body.chainId
		});

		if (body.action === "ensureAccount") {
			const { smartAccountAddress } = await ensureAccount({
				ownerAddress: body.ownerAddress,
				chainId: body.chainId
			});

			logRelay("ensure_account_completed", {
				ownerAddress: body.ownerAddress,
				chainId: body.chainId,
				smartAccountAddress
			});
			return NextResponse.json({ smartAccountAddress });
		}

		if (body.action === "execute") {
			validateSponsoredCall({
				target: body.target,
				chainId: body.chainId,
				value: body.value,
				data: body.data
			});

			const { publicClient, walletClient, relayerAccount } = getClients(body.chainId);
			logRelay("execute_started", {
				chainId: body.chainId,
				smartAccountAddress: body.smartAccountAddress,
				target: body.target
			});
			const hash = await walletClient.writeContract({
				address: body.smartAccountAddress,
				abi: wave3SmartAccountAbi,
				functionName: "execute",
				args: [body.target, BigInt(body.value), body.data, BigInt(body.deadline), body.signature],
				account: relayerAccount
			});

			await publicClient.waitForTransactionReceipt({ hash });
			logRelay("execute_completed", {
				chainId: body.chainId,
				smartAccountAddress: body.smartAccountAddress,
				hash
			});

			return NextResponse.json({ hash });
		}

		if (body.action === "authorizeSessionKey") {
			validateSponsoredCall({
				target: body.target,
				chainId: body.chainId,
				value: "0",
				data: `${body.selector}0000000000000000000000000000000000000000000000000000000000000000` as Hex
			});

			const { smartAccountAddress, publicClient, walletClient, relayerAccount } = await ensureAccount({
				ownerAddress: body.ownerAddress,
				chainId: body.chainId
			});

			if (smartAccountAddress.toLowerCase() !== body.smartAccountAddress.toLowerCase()) {
				throw new Error("Smart account address mismatch");
			}

			logRelay("authorize_session_started", {
				chainId: body.chainId,
				smartAccountAddress: body.smartAccountAddress,
				sessionKey: body.sessionKey,
				target: body.target,
				maxCalls: body.maxCalls
			});
			const hash = await walletClient.writeContract({
				address: body.smartAccountAddress,
				abi: wave3SmartAccountAbi,
				functionName: "authorizeSessionKey",
				args: [
					body.sessionKey,
					body.target,
					body.selector,
					BigInt(body.validUntil),
					body.maxCalls,
					BigInt(body.deadline),
					body.signature
				],
				account: relayerAccount
			});

			await publicClient.waitForTransactionReceipt({ hash });
			logRelay("authorize_session_completed", {
				chainId: body.chainId,
				smartAccountAddress: body.smartAccountAddress,
				sessionKey: body.sessionKey,
				hash
			});

			return NextResponse.json({ hash });
		}

		if (body.action === "executeSession") {
			validateSponsoredCall({
				target: body.target,
				chainId: body.chainId,
				value: body.value,
				data: body.data
			});

			const { publicClient, walletClient, relayerAccount } = getClients(body.chainId);
			logRelay("execute_session_started", {
				chainId: body.chainId,
				smartAccountAddress: body.smartAccountAddress,
				sessionKey: body.sessionKey,
				target: body.target
			});
			const hash = await walletClient.writeContract({
				address: body.smartAccountAddress,
				abi: wave3SmartAccountAbi,
				functionName: "executeSession",
				args: [
					body.sessionKey,
					body.target,
					BigInt(body.value),
					body.data,
					BigInt(body.deadline),
					body.sessionSignature
				],
				account: relayerAccount
			});

			await publicClient.waitForTransactionReceipt({ hash });
			logRelay("execute_session_completed", {
				chainId: body.chainId,
				smartAccountAddress: body.smartAccountAddress,
				sessionKey: body.sessionKey,
				hash
			});

			return NextResponse.json({ hash });
		}

		return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown relay error";
		logRelay("request_failed", { message });
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
