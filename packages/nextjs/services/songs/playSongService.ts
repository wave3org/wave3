import {
  Address,
  Hash,
  Hex,
  PublicClient,
  WalletClient,
  encodeFunctionData,
  parseEther,
  toFunctionSelector,
} from "viem";
import { PrivateKeyAccount, generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  authorizeSessionKey,
  ensureSmartAccount,
  getSmartAccountSession,
  isSmartAccountModeEnabled,
  sendSponsoredSessionTx,
} from "~~/services/web3/smartAccount";

type WriteWavecoinFn = (params: {
  functionName: "approve";
  args: [Address, bigint];
}) => Promise<Hash | undefined>;

type WriteRoyaltiesFn = (params: {
  functionName: "playSong";
  args: [bigint];
}) => Promise<Hash | undefined>;

type PayToPlaySongParams = {
  songId: string;
  ownerAddress: Address;
  chainId: number;
  wavecoinAddress: Address;
  royaltiesAddress: Address;
  writeWavecoin: WriteWavecoinFn;
  writeRoyalties: WriteRoyaltiesFn;
  publicClient: PublicClient;
  walletClient?: WalletClient;
};

const ERC20_ALLOWANCE_ABI = [
  {
    type: "function",
    stateMutability: "view",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
  },
] as const;

const SONG_ROYALTIES_PLAY_ABI = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "playSong",
    inputs: [{ name: "songId", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
] as const;

const PLAYBACK_FEE = parseEther("1");
const MAX_UINT256 = (1n << 256n) - 1n;
const PLAY_SONG_SELECTOR = toFunctionSelector("playSong(uint256)");
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const SESSION_MAX_CALLS = 100;

const isPlaybackSessionModeEnabled = () => process.env.NEXT_PUBLIC_ENABLE_PLAYBACK_SESSIONS === "true";

const sessionStorageKey = ({ chainId, owner, smartAccount }: { chainId: number; owner: Address; smartAccount: Address }) =>
  `wave3:session-key:${chainId}:${owner.toLowerCase()}:${smartAccount.toLowerCase()}`;

const getStoredSessionPrivateKey = (key: string): Hex | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const value = window.localStorage.getItem(key);
  return value ? (value as Hex) : undefined;
};

const setStoredSessionPrivateKey = (key: string, privateKey: Hex) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, privateKey);
};

const isValidPlaybackSession = ({
  session,
  royaltiesAddress,
}: {
  session: Awaited<ReturnType<typeof getSmartAccountSession>>;
  royaltiesAddress: Address;
}) => {
  const now = Math.floor(Date.now() / 1000);
  return (
    session.active &&
    session.target.toLowerCase() === royaltiesAddress.toLowerCase() &&
    session.selector.toLowerCase() === PLAY_SONG_SELECTOR.toLowerCase() &&
    Number(session.validUntil) > now + 60 &&
    session.usedCalls < session.maxCalls
  );
};

const ensurePlaybackSession = async ({
  chainId,
  ownerAddress,
  smartAccountAddress,
  royaltiesAddress,
  walletClient,
  publicClient,
}: {
  chainId: number;
  ownerAddress: Address;
  smartAccountAddress: Address;
  royaltiesAddress: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
}): Promise<PrivateKeyAccount> => {
  const storageKey = sessionStorageKey({
    chainId,
    owner: ownerAddress,
    smartAccount: smartAccountAddress,
  });

  let sessionPrivateKey = getStoredSessionPrivateKey(storageKey);
  if (!sessionPrivateKey) {
    sessionPrivateKey = generatePrivateKey();
    setStoredSessionPrivateKey(storageKey, sessionPrivateKey);
  }

  const sessionAccount = privateKeyToAccount(sessionPrivateKey);
  const session = await getSmartAccountSession({
    publicClient,
    smartAccount: smartAccountAddress,
    sessionKey: sessionAccount.address,
  });

  if (!isValidPlaybackSession({ session, royaltiesAddress })) {
    const validUntil = BigInt(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
    const txHash = await authorizeSessionKey({
      walletClient,
      publicClient,
      chainId,
      owner: ownerAddress,
      smartAccount: smartAccountAddress,
      sessionKey: sessionAccount.address,
      target: royaltiesAddress,
      selector: PLAY_SONG_SELECTOR,
      validUntil,
      maxCalls: SESSION_MAX_CALLS,
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  return sessionAccount;
};

export async function payToPlaySong({
  songId,
  ownerAddress,
  chainId,
  wavecoinAddress,
  royaltiesAddress,
  writeWavecoin,
  writeRoyalties,
  publicClient,
  walletClient,
}: PayToPlaySongParams): Promise<void> {
  const smartAccountModeEnabled = isSmartAccountModeEnabled();
  const playbackSessionModeEnabled = isPlaybackSessionModeEnabled();

  let payerAddress = ownerAddress;
  let smartAccountAddress: Address | undefined = undefined;

  if (smartAccountModeEnabled) {
    if (!walletClient) {
      throw new Error("Wallet client not available for smart account signing");
    }
    smartAccountAddress = await ensureSmartAccount({
      publicClient,
      chainId,
      owner: ownerAddress,
    });
    payerAddress = smartAccountAddress;
  }

  const currentAllowance = (await publicClient.readContract({
    address: wavecoinAddress,
    abi: ERC20_ALLOWANCE_ABI,
    functionName: "allowance",
    args: [payerAddress, royaltiesAddress],
  })) as bigint;

  if (currentAllowance < PLAYBACK_FEE) {
    const approveTxHash = await writeWavecoin({
      functionName: "approve",
      args: [royaltiesAddress, MAX_UINT256],
    });

    if (!approveTxHash) {
      throw new Error("Approval transaction failed");
    }

    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
  }

  if (smartAccountModeEnabled && playbackSessionModeEnabled) {
    if (!walletClient || !smartAccountAddress) {
      throw new Error("Session key playback requires an initialized smart account and wallet client");
    }

    const sessionAccount = await ensurePlaybackSession({
      chainId,
      ownerAddress,
      smartAccountAddress,
      royaltiesAddress,
      walletClient,
      publicClient,
    });

    const playData = encodeFunctionData({
      abi: SONG_ROYALTIES_PLAY_ABI,
      functionName: "playSong",
      args: [BigInt(songId)],
    });

    const sessionTxHash = await sendSponsoredSessionTx({
      sessionAccount,
      publicClient,
      chainId,
      smartAccount: smartAccountAddress,
      target: royaltiesAddress,
      data: playData,
      value: 0n,
    });

    await publicClient.waitForTransactionReceipt({ hash: sessionTxHash });
    return;
  }

  const playTxHash = await writeRoyalties({
    functionName: "playSong",
    args: [BigInt(songId)],
  });

  if (!playTxHash) {
    throw new Error("Playback transaction failed");
  }

  await publicClient.waitForTransactionReceipt({ hash: playTxHash });
}
