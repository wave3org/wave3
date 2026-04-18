import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { type Address, type Hex, parseAbi, toFunctionSelector } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";

export const wave3SmartAccountFactoryAbi = parseAbi([
	"function getAccount(address owner) view returns (address)",
	"function createAccount(address owner) returns (address)"
]);

export const wave3SmartAccountAbi = parseAbi([
	"function nonce() view returns (uint256)",
	"function sessionNonces(address sessionKey) view returns (uint256)",
	"function execute(address target,uint256 value,bytes data,uint256 deadline,bytes signature) payable returns (bytes)",
	"function authorizeSessionKey(address sessionKey,address target,bytes4 selector,uint64 validUntil,uint32 maxCalls,uint256 deadline,bytes signature)",
	"function executeSession(address sessionKey,address target,uint256 value,bytes data,uint256 deadline,bytes sessionSignature) payable returns (bytes)",
	"function getSession(address sessionKey) view returns ((bool active,address target,bytes4 selector,uint64 validUntil,uint32 maxCalls,uint32 usedCalls))",
	"error InvalidOwner()",
	"error InvalidSignature()",
	"error DeadlineExpired()",
	"error CallFailed(bytes reason)",
	"error InvalidSessionKey()",
	"error InvalidSessionSignature()",
	"error InvalidSessionConfig()",
	"error SessionExpired()",
	"error SessionUsageExceeded()",
	"error SessionUnauthorizedTarget()",
	"error SessionUnauthorizedSelector()",
	"error SessionValueNotAllowed()"
]);

export const WAVECOIN_BUY_PLAY_SIGNATURE = "buyPlayFor(uint256,address)";
export const WAVECOIN_BUY_PLAY_SELECTOR = toFunctionSelector(WAVECOIN_BUY_PLAY_SIGNATURE);
export const DEFAULT_SESSION_DURATION_SECONDS = 60 * 60 * 24;
export const DEFAULT_SESSION_MAX_CALLS = 100;

export const getSmartAccountFactoryAddress = (chainId: number): Address | undefined => {
	const chainContracts = deployedContracts[chainId as keyof typeof deployedContracts];
	const address = chainContracts?.Wave3SmartAccountFactory?.address;
	return address as Address | undefined;
};

const isFeatureEnabledByDefault = (value: string | undefined) => value !== "false";

export const isSmartAccountEnabled = () => isFeatureEnabledByDefault(process.env.NEXT_PUBLIC_ENABLE_SMART_ACCOUNTS);
export const isPlaybackSessionsEnabled = () =>
	isFeatureEnabledByDefault(process.env.NEXT_PUBLIC_ENABLE_PLAYBACK_SESSIONS);

export type SmartAccountEnsureRequest = {
	action: "ensureAccount";
	chainId: number;
	ownerAddress: Address;
};

export type SmartAccountExecuteRequest = {
	action: "execute";
	chainId: number;
	smartAccountAddress: Address;
	target: Address;
	value: string;
	data: Hex;
	deadline: string;
	signature: Hex;
};

export type SmartAccountAuthorizeSessionRequest = {
	action: "authorizeSessionKey";
	chainId: number;
	ownerAddress: Address;
	smartAccountAddress: Address;
	sessionKey: Address;
	target: Address;
	selector: Hex;
	validUntil: string;
	maxCalls: number;
	deadline: string;
	signature: Hex;
};

export type SmartAccountExecuteSessionRequest = {
	action: "executeSession";
	chainId: number;
	smartAccountAddress: Address;
	sessionKey: Address;
	target: Address;
	value: string;
	data: Hex;
	deadline: string;
	sessionSignature: Hex;
};

export type StoredSessionKey = {
	privateKey: Hex;
	address: Address;
	validUntil: string;
	maxCalls: number;
};

const getSessionStorageKey = (ownerAddress: Address, chainId: number) =>
	`wave3:smart-account:session:${chainId}:${ownerAddress.toLowerCase()}`;

export const loadStoredSessionKey = (ownerAddress: Address, chainId: number): StoredSessionKey | null => {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = window.localStorage.getItem(getSessionStorageKey(ownerAddress, chainId));
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as StoredSessionKey;
	} catch {
		window.localStorage.removeItem(getSessionStorageKey(ownerAddress, chainId));
		return null;
	}
};

export const saveStoredSessionKey = (ownerAddress: Address, chainId: number, sessionKey: StoredSessionKey) => {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.setItem(getSessionStorageKey(ownerAddress, chainId), JSON.stringify(sessionKey));
};

export const clearStoredSessionKey = (ownerAddress: Address, chainId: number) => {
	if (typeof window === "undefined") {
		return;
	}

	window.localStorage.removeItem(getSessionStorageKey(ownerAddress, chainId));
};

export const createSessionKey = (validUntil: bigint, maxCalls: number): StoredSessionKey => {
	const privateKey = generatePrivateKey();
	const account = privateKeyToAccount(privateKey);

	return {
		privateKey,
		address: account.address,
		validUntil: validUntil.toString(),
		maxCalls
	};
};
