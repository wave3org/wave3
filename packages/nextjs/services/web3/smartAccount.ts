import deployedContracts from "~~/contracts/deployedContracts";
import { Address, Hash, Hex, PublicClient, WalletClient, getAddress, isAddress, keccak256, zeroAddress } from "viem";
import { PrivateKeyAccount } from "viem/accounts";

export const WAVE3_SMART_ACCOUNT_ABI = [
  {
    type: "function",
    stateMutability: "view",
    name: "nonce",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "execute",
    inputs: [
      { name: "target", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
      { name: "data", type: "bytes", internalType: "bytes" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "returnData", type: "bytes", internalType: "bytes" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "authorizeSessionKey",
    inputs: [
      { name: "sessionKey", type: "address", internalType: "address" },
      { name: "target", type: "address", internalType: "address" },
      { name: "selector", type: "bytes4", internalType: "bytes4" },
      { name: "validUntil", type: "uint64", internalType: "uint64" },
      { name: "maxCalls", type: "uint32", internalType: "uint32" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "revokeSessionKey",
    inputs: [
      { name: "sessionKey", type: "address", internalType: "address" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "signature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "executeSession",
    inputs: [
      { name: "sessionKey", type: "address", internalType: "address" },
      { name: "target", type: "address", internalType: "address" },
      { name: "value", type: "uint256", internalType: "uint256" },
      { name: "data", type: "bytes", internalType: "bytes" },
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "sessionSignature", type: "bytes", internalType: "bytes" },
    ],
    outputs: [{ name: "returnData", type: "bytes", internalType: "bytes" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "sessionNonces",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getSession",
    inputs: [{ name: "sessionKey", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct Wave3SmartAccount.SessionConfig",
        components: [
          { name: "active", type: "bool", internalType: "bool" },
          { name: "target", type: "address", internalType: "address" },
          { name: "selector", type: "bytes4", internalType: "bytes4" },
          { name: "validUntil", type: "uint64", internalType: "uint64" },
          { name: "maxCalls", type: "uint32", internalType: "uint32" },
          { name: "usedCalls", type: "uint32", internalType: "uint32" },
        ],
      },
    ],
  },
] as const;

export const WAVE3_SMART_ACCOUNT_FACTORY_ABI = [
  {
    type: "function",
    stateMutability: "view",
    name: "getAccount",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "createAccount",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "account", type: "address", internalType: "address" }],
  },
] as const;

const EXECUTE_TYPES = {
  Execute: [
    { name: "target", type: "address" },
    { name: "value", type: "uint256" },
    { name: "dataHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const AUTHORIZE_SESSION_KEY_TYPES = {
  AuthorizeSessionKey: [
    { name: "sessionKey", type: "address" },
    { name: "target", type: "address" },
    { name: "selector", type: "bytes4" },
    { name: "validUntil", type: "uint64" },
    { name: "maxCalls", type: "uint32" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const EXECUTE_SESSION_TYPES = {
  ExecuteSession: [
    { name: "sessionKey", type: "address" },
    { name: "target", type: "address" },
    { name: "value", type: "uint256" },
    { name: "dataHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const SMART_ACCOUNT_DOMAIN = {
  name: "Wave3SmartAccount",
  version: "1",
} as const;

type RelayCreateResponse = {
  txHash: Hash;
  smartAccount: Address;
};

type RelayExecuteResponse = {
  txHash: Hash;
};

type RelayAuthorizeSessionResponse = {
  txHash: Hash;
};

type RelayExecuteSessionResponse = {
  txHash: Hash;
};

const toChainContracts = (chainId: number) => {
  return (deployedContracts as Record<number, Record<string, { address: Address }>>)[chainId];
};

const getFactoryFromContracts = (chainId: number): Address | undefined => {
  const chainContracts = toChainContracts(chainId);
  return chainContracts?.Wave3SmartAccountFactory?.address;
};

export const isSmartAccountModeEnabled = () => process.env.NEXT_PUBLIC_ENABLE_SMART_ACCOUNTS === "true";

export const getSmartAccountFactoryAddress = (chainId: number): Address | undefined => {
  const envFactory = process.env.NEXT_PUBLIC_SMART_ACCOUNT_FACTORY_ADDRESS;
  if (envFactory && isAddress(envFactory)) {
    return getAddress(envFactory);
  }
  return getFactoryFromContracts(chainId);
};

const relayPost = async <TResponse>(body: Record<string, string | number>) => {
  const response = await fetch("/api/smart-account/relay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok) {
    const error = json?.error ?? "Relay request failed";
    throw new Error(error);
  }

  return json as TResponse;
};

export const getSmartAccountAddress = async ({
  publicClient,
  chainId,
  owner,
}: {
  publicClient: PublicClient;
  chainId: number;
  owner: Address;
}): Promise<Address | undefined> => {
  const factoryAddress = getSmartAccountFactoryAddress(chainId);
  if (!factoryAddress) {
    return undefined;
  }

  const account = await publicClient.readContract({
    address: factoryAddress,
    abi: WAVE3_SMART_ACCOUNT_FACTORY_ABI,
    functionName: "getAccount",
    args: [owner],
  });

  if (account === zeroAddress) {
    return undefined;
  }

  return account as Address;
};

export type SmartAccountSession = {
  active: boolean;
  target: Address;
  selector: Hex;
  validUntil: bigint;
  maxCalls: number;
  usedCalls: number;
};

export const getSmartAccountSession = async ({
  publicClient,
  smartAccount,
  sessionKey,
}: {
  publicClient: PublicClient;
  smartAccount: Address;
  sessionKey: Address;
}): Promise<SmartAccountSession> => {
  const session = await publicClient.readContract({
    address: smartAccount,
    abi: WAVE3_SMART_ACCOUNT_ABI,
    functionName: "getSession",
    args: [sessionKey],
  });

  return {
    active: session.active,
    target: session.target as Address,
    selector: session.selector as Hex,
    validUntil: BigInt(session.validUntil),
    maxCalls: Number(session.maxCalls),
    usedCalls: Number(session.usedCalls),
  };
};

export const ensureSmartAccount = async ({
  publicClient,
  chainId,
  owner,
}: {
  publicClient: PublicClient;
  chainId: number;
  owner: Address;
}): Promise<Address> => {
  const existingAccount = await getSmartAccountAddress({ publicClient, chainId, owner });
  if (existingAccount) {
    return existingAccount;
  }

  const created = await relayPost<RelayCreateResponse>({
    action: "createAccount",
    chainId,
    owner,
  });

  if (!created.smartAccount || !isAddress(created.smartAccount)) {
    throw new Error("Failed to create smart account");
  }

  return getAddress(created.smartAccount);
};

export const authorizeSessionKey = async ({
  walletClient,
  publicClient,
  chainId,
  owner,
  smartAccount,
  sessionKey,
  target,
  selector,
  validUntil,
  maxCalls,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  chainId: number;
  owner: Address;
  smartAccount: Address;
  sessionKey: Address;
  target: Address;
  selector: Hex;
  validUntil: bigint;
  maxCalls: number;
}): Promise<Hash> => {
  const nonce = await publicClient.readContract({
    address: smartAccount,
    abi: WAVE3_SMART_ACCOUNT_ABI,
    functionName: "nonce",
  });
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  const signature = await walletClient.signTypedData({
    account: owner,
    domain: {
      ...SMART_ACCOUNT_DOMAIN,
      chainId,
      verifyingContract: smartAccount,
    },
    types: AUTHORIZE_SESSION_KEY_TYPES,
    primaryType: "AuthorizeSessionKey",
    message: {
      sessionKey,
      target,
      selector,
      validUntil,
      maxCalls,
      nonce,
      deadline,
    },
  });

  const result = await relayPost<RelayAuthorizeSessionResponse>({
    action: "authorizeSessionKey",
    chainId,
    smartAccount,
    sessionKey,
    target,
    selector,
    validUntil: validUntil.toString(),
    maxCalls,
    deadline: deadline.toString(),
    signature,
  });

  return result.txHash;
};

export const sendSponsoredSmartAccountTx = async ({
  walletClient,
  publicClient,
  chainId,
  owner,
  smartAccount: smartAccountAddress,
  target,
  data,
  value = 0n,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  chainId: number;
  owner: Address;
  smartAccount?: Address;
  target: Address;
  data: Hex;
  value?: bigint;
}): Promise<Hash> => {
  const smartAccount = smartAccountAddress ?? (await ensureSmartAccount({ publicClient, chainId, owner }));
  const nonce = await publicClient.readContract({
    address: smartAccount,
    abi: WAVE3_SMART_ACCOUNT_ABI,
    functionName: "nonce",
  });

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
  const signature = await walletClient.signTypedData({
    account: owner,
    domain: {
      ...SMART_ACCOUNT_DOMAIN,
      chainId,
      verifyingContract: smartAccount,
    },
    types: EXECUTE_TYPES,
    primaryType: "Execute",
    message: {
      target,
      value,
      dataHash: keccak256(data),
      nonce,
      deadline,
    },
  });

  const result = await relayPost<RelayExecuteResponse>({
    action: "execute",
    chainId,
    smartAccount,
    target,
    data,
    value: value.toString(),
    deadline: deadline.toString(),
    signature,
  });

  return result.txHash;
};

export const sendSponsoredSessionTx = async ({
  sessionAccount,
  publicClient,
  chainId,
  smartAccount,
  target,
  data,
  value = 0n,
}: {
  sessionAccount: PrivateKeyAccount;
  publicClient: PublicClient;
  chainId: number;
  smartAccount: Address;
  target: Address;
  data: Hex;
  value?: bigint;
}): Promise<Hash> => {
  const nonce = await publicClient.readContract({
    address: smartAccount,
    abi: WAVE3_SMART_ACCOUNT_ABI,
    functionName: "sessionNonces",
    args: [sessionAccount.address],
  });
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

  const signature = await sessionAccount.signTypedData({
    domain: {
      ...SMART_ACCOUNT_DOMAIN,
      chainId,
      verifyingContract: smartAccount,
    },
    types: EXECUTE_SESSION_TYPES,
    primaryType: "ExecuteSession",
    message: {
      sessionKey: sessionAccount.address,
      target,
      value,
      dataHash: keccak256(data),
      nonce,
      deadline,
    },
  });

  const result = await relayPost<RelayExecuteSessionResponse>({
    action: "executeSession",
    chainId,
    smartAccount,
    sessionKey: sessionAccount.address,
    target,
    data,
    value: value.toString(),
    deadline: deadline.toString(),
    signature,
  });

  return result.txHash;
};
