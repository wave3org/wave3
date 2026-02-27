import { NextRequest, NextResponse } from "next/server";
import deployedContracts from "~~/contracts/deployedContracts";
import { WAVE3_SMART_ACCOUNT_ABI, WAVE3_SMART_ACCOUNT_FACTORY_ABI } from "~~/services/web3/smartAccount";
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
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat, sepolia } from "viem/chains";

const SUPPORTED_CHAINS = {
  [hardhat.id]: hardhat,
  [sepolia.id]: sepolia,
} as const;

type RelayCreateAccountRequest = {
  action: "createAccount";
  chainId: number;
  owner: string;
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

const PLAY_SONG_SELECTOR = toFunctionSelector("playSong(uint256)");

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
    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || "cR4WnXePioePZ5fFrnSiR";
    return `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  }

  throw new Error(`Unsupported chain for sponsored tx: ${chainId}`);
};

const getFactoryAddress = (chainId: number): Address => {
  const envFactory = process.env.NEXT_PUBLIC_SMART_ACCOUNT_FACTORY_ADDRESS;
  if (envFactory && isAddress(envFactory)) {
    return getAddress(envFactory);
  }

  const chainContracts = (deployedContracts as Record<number, Record<string, { address: Address }>>)[chainId];
  const deployedFactory = chainContracts?.Wave3SmartAccountFactory?.address;
  if (!deployedFactory) {
    throw new Error("Wave3SmartAccountFactory address is not configured");
  }

  return deployedFactory;
};

const isSponsoredTarget = (chainId: number, target: Address) => {
  const chainContracts = (deployedContracts as Record<number, Record<string, { address: Address }>>)[chainId];
  if (!chainContracts) {
    return false;
  }

  const allowedAddresses = Object.values(chainContracts).map(contract => contract.address.toLowerCase());
  return allowedAddresses.includes(target.toLowerCase());
};

const getSongRoyaltiesAddress = (chainId: number): Address | undefined => {
  const chainContracts = (deployedContracts as Record<number, Record<string, { address: Address }>>)[chainId];
  return chainContracts?.SongRoyalties?.address;
};

const isValidPlaybackSessionTarget = (chainId: number, target: Address, selector: string) => {
  const royaltiesAddress = getSongRoyaltiesAddress(chainId);
  if (!royaltiesAddress) {
    return false;
  }
  return target.toLowerCase() === royaltiesAddress.toLowerCase() && selector.toLowerCase() === PLAY_SONG_SELECTOR.toLowerCase();
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
    transport,
  });

  const walletClient = createWalletClient({
    chain,
    transport,
    account,
  });

  return {
    account,
    publicClient,
    walletClient,
  };
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

      const owner = getAddress(body.owner);
      const txHash = await walletClient.writeContract({
        account,
        address: factoryAddress,
        abi: WAVE3_SMART_ACCOUNT_FACTORY_ABI,
        functionName: "createAccount",
        args: [owner],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      const smartAccount = await publicClient.readContract({
        address: factoryAddress,
        abi: WAVE3_SMART_ACCOUNT_FACTORY_ABI,
        functionName: "getAccount",
        args: [owner],
      });

      if (!smartAccount || smartAccount === zeroAddress) {
        throw new Error("Smart account creation failed");
      }

      return NextResponse.json({
        txHash,
        smartAccount,
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
      const value = BigInt(body.value);
      const deadline = BigInt(body.deadline);

      if (value !== 0n) {
        return NextResponse.json({ error: "Sponsored calls with value are not allowed" }, { status: 400 });
      }

      if (!isSponsoredTarget(chainId, target)) {
        return NextResponse.json({ error: "Target contract is not allowed for sponsorship" }, { status: 403 });
      }

      const txHash = await walletClient.writeContract({
        account,
        address: smartAccount,
        abi: WAVE3_SMART_ACCOUNT_ABI,
        functionName: "execute",
        args: [target, value, body.data, deadline, body.signature],
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
      const validUntil = BigInt(body.validUntil);
      const maxCalls = Number(body.maxCalls);
      const deadline = BigInt(body.deadline);
      const selector = body.selector as Hex;

      if (!isSponsoredTarget(chainId, target)) {
        return NextResponse.json({ error: "Target contract is not allowed for sponsorship" }, { status: 403 });
      }
      if (!isValidPlaybackSessionTarget(chainId, target, selector)) {
        return NextResponse.json({ error: "Session key can only be authorized for SongRoyalties.playSong" }, { status: 403 });
      }
      if (maxCalls <= 0) {
        return NextResponse.json({ error: "maxCalls must be greater than 0" }, { status: 400 });
      }

      const txHash = await walletClient.writeContract({
        account,
        address: smartAccount,
        abi: WAVE3_SMART_ACCOUNT_ABI,
        functionName: "authorizeSessionKey",
        args: [sessionKey, target, selector, validUntil, maxCalls, deadline, body.signature],
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
      const value = BigInt(body.value);
      const deadline = BigInt(body.deadline);

      if (value !== 0n) {
        return NextResponse.json({ error: "Session calls with value are not allowed" }, { status: 400 });
      }
      if (!isSponsoredTarget(chainId, target)) {
        return NextResponse.json({ error: "Target contract is not allowed for sponsorship" }, { status: 403 });
      }
      const selector = body.data.slice(0, 10);
      if (!isValidPlaybackSessionTarget(chainId, target, selector)) {
        return NextResponse.json({ error: "Session execution is restricted to SongRoyalties.playSong" }, { status: 403 });
      }

      const txHash = await walletClient.writeContract({
        account,
        address: smartAccount,
        abi: WAVE3_SMART_ACCOUNT_ABI,
        functionName: "executeSession",
        args: [sessionKey, target, value, body.data, deadline, body.signature],
      });

      return NextResponse.json({ txHash });
    }

    return NextResponse.json({ error: "Invalid relay action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Relay request failed",
      },
      { status: 500 },
    );
  }
}
