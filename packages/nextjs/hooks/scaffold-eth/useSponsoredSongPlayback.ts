"use client";

import { useState } from "react";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useScaffoldWriteContract } from "./useScaffoldWriteContract";
import { type Address, encodeFunctionData, getAddress, keccak256, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { playSong } from "~~/components/MusicPlayer";
import scaffoldConfig from "~~/scaffold.config";
import { getFileUrl } from "~~/services/files/fileService";
import type { SongFromPonder } from "~~/services/songs/ponderSongService";
import {
	DEFAULT_SESSION_DURATION_SECONDS,
	DEFAULT_SESSION_MAX_CALLS,
	type SmartAccountAuthorizeSessionRequest,
	type SmartAccountEnsureRequest,
	type SmartAccountExecuteRequest,
	type SmartAccountExecuteSessionRequest,
	WAVECOIN_BUY_PLAY_SELECTOR,
	clearStoredSessionKey,
	createSessionKey,
	getSmartAccountFactoryAddress,
	isPlaybackSessionsEnabled,
	isSmartAccountEnabled,
	loadStoredSessionKey,
	saveStoredSessionKey,
	wave3SmartAccountAbi,
	wave3SmartAccountFactoryAbi
} from "~~/services/web3/smartAccount";
import type { AllowedChainIds } from "~~/utils/scaffold-eth/networks";
import { notification } from "~~/utils/scaffold-eth/notification";

type SessionConfig = {
	active: boolean;
	target: Address;
	selector: `0x${string}`;
	validUntil: bigint;
	maxCalls: number;
	usedCalls: number;
};

type PlaybackDebugState = {
	step: string | null;
	smartAccountAddress: Address | null;
	sessionKeyAddress: Address | null;
	executionMode: "wallet" | "smart-account" | "session-key" | null;
	relayHash: string | null;
};

/**
 * Hook for playing a song by calling Wavecoin.buyPlay(songId).
 * Handles loading state and music player integration.
 */
export const useSponsoredSongPlayback = () => {
	const [isStartingPlayback, setIsStartingPlayback] = useState(false);
	const [pendingSongId, setPendingSongId] = useState<string | null>(null);
	const [playbackStatus, setPlaybackStatus] = useState<string | null>(null);
	const [debugState, setDebugState] = useState<PlaybackDebugState>({
		step: null,
		smartAccountAddress: null,
		sessionKeyAddress: null,
		executionMode: null,
		relayHash: null
	});
	const { address: ownerAddress, chain } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient({ chainId: chain?.id });
	const { writeContractAsync: writeWavecoin } = useScaffoldWriteContract({ contractName: "Wavecoin" });
	const targetChainId =
		chain && scaffoldConfig.targetNetworks.some(targetNetwork => targetNetwork.id === chain.id)
			? (chain.id as AllowedChainIds)
			: undefined;
	const { data: wavecoinContract } = useDeployedContractInfo({ contractName: "Wavecoin", chainId: targetChainId });

	const updateDebugState = (updates: Partial<PlaybackDebugState>) => {
		setDebugState(previous => ({ ...previous, ...updates }));
	};

	const logPlayback = (event: string, details?: Record<string, unknown>) => {
		console.info("[Wave3][playback]", event, {
			ownerAddress,
			chainId: chain?.id,
			...details
		});
	};

	const playInMusicPlayer = (song: SongFromPonder) => {
		playSong({
			id: song.songId,
			title: song.name,
			artist: song.album?.artist || "Unknown Artist",
			audioUrl: getFileUrl(song.audioCID),
			cover: song.album?.imageCID ? getFileUrl(song.album.imageCID) : undefined
		});
	};

	const getOrCreateSmartAccountAddress = async () => {
		if (!ownerAddress || !chain?.id || !publicClient) {
			throw new Error("Wallet not connected");
		}

		const factoryAddress = getSmartAccountFactoryAddress(chain.id);
		if (!factoryAddress) {
			throw new Error("Wave3SmartAccountFactory is not deployed for the selected chain");
		}

		const currentAddress = await publicClient.readContract({
			address: factoryAddress,
			abi: wave3SmartAccountFactoryAbi,
			functionName: "getAccount",
			args: [ownerAddress]
		});

		if (currentAddress !== zeroAddress) {
			logPlayback("smart_account_found", { smartAccountAddress: currentAddress });
			updateDebugState({ smartAccountAddress: currentAddress });
			return currentAddress;
		}

		setPlaybackStatus("Creating your smart account...");
		logPlayback("smart_account_missing", { ownerAddress });

		const response = await fetch("/api/smart-account/relay", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "ensureAccount",
				chainId: chain.id,
				ownerAddress
			} satisfies SmartAccountEnsureRequest)
		});

		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.error || "Failed to create smart account");
		}

		const smartAccountAddress = getAddress(payload.smartAccountAddress);
		logPlayback("smart_account_created", {
			smartAccountAddress,
			relayHash: payload.hash ?? null
		});
		updateDebugState({
			smartAccountAddress,
			relayHash: payload.hash ?? null
		});

		return smartAccountAddress;
	};

	const getBuyPlayData = (songId: string) => {
		if (!wavecoinContract || !ownerAddress) {
			throw new Error("Wavecoin contract is not ready yet");
		}

		return encodeFunctionData({
			abi: wavecoinContract.abi,
			functionName: "buyPlayFor",
			args: [BigInt(songId), ownerAddress]
		});
	};

	const getCurrentSession = async (
		smartAccountAddress: Address,
		sessionKeyAddress: Address
	): Promise<SessionConfig | null> => {
		if (!publicClient) {
			return null;
		}

		const session = (await publicClient.readContract({
			address: smartAccountAddress,
			abi: wave3SmartAccountAbi,
			functionName: "getSession",
			args: [sessionKeyAddress]
		})) as SessionConfig;

		return session;
	};

	const authorizePlaybackSession = async (smartAccountAddress: Address, target: Address) => {
		if (!ownerAddress || !chain?.id || !walletClient || !publicClient) {
			throw new Error("Wallet not connected");
		}

		setPlaybackStatus("Authorizing your playback session...");
		logPlayback("authorizing_session_key", { smartAccountAddress, target });

		const validUntil = BigInt(Math.floor(Date.now() / 1000) + DEFAULT_SESSION_DURATION_SECONDS);
		const maxCalls = DEFAULT_SESSION_MAX_CALLS;
		const sessionKey = createSessionKey(validUntil, maxCalls);
		const nonce = await publicClient.readContract({
			address: smartAccountAddress,
			abi: wave3SmartAccountAbi,
			functionName: "nonce"
		});
		const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

		const signature = await walletClient.signTypedData({
			account: ownerAddress,
			domain: {
				name: "Wave3SmartAccount",
				version: "1",
				chainId: chain.id,
				verifyingContract: smartAccountAddress
			},
			types: {
				AuthorizeSessionKey: [
					{ name: "sessionKey", type: "address" },
					{ name: "target", type: "address" },
					{ name: "selector", type: "bytes4" },
					{ name: "validUntil", type: "uint64" },
					{ name: "maxCalls", type: "uint32" },
					{ name: "nonce", type: "uint256" },
					{ name: "deadline", type: "uint256" }
				]
			},
			primaryType: "AuthorizeSessionKey",
			message: {
				sessionKey: sessionKey.address,
				target,
				selector: WAVECOIN_BUY_PLAY_SELECTOR,
				validUntil,
				maxCalls,
				nonce,
				deadline
			}
		});

		const response = await fetch("/api/smart-account/relay", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "authorizeSessionKey",
				chainId: chain.id,
				ownerAddress,
				smartAccountAddress,
				sessionKey: sessionKey.address,
				target,
				selector: WAVECOIN_BUY_PLAY_SELECTOR,
				validUntil: validUntil.toString(),
				maxCalls,
				deadline: deadline.toString(),
				signature
			} satisfies SmartAccountAuthorizeSessionRequest)
		});

		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.error || "Failed to authorize playback session");
		}

		saveStoredSessionKey(ownerAddress, chain.id, sessionKey);
		logPlayback("session_key_authorized", {
			smartAccountAddress,
			sessionKeyAddress: sessionKey.address,
			validUntil: sessionKey.validUntil,
			maxCalls,
			relayHash: payload.hash ?? null
		});
		updateDebugState({
			smartAccountAddress,
			sessionKeyAddress: sessionKey.address,
			executionMode: "session-key",
			relayHash: payload.hash ?? null
		});
		return sessionKey;
	};

	const getOrCreatePlaybackSession = async (smartAccountAddress: Address, target: Address) => {
		if (!ownerAddress || !chain?.id) {
			throw new Error("Wallet not connected");
		}

		const storedSessionKey = loadStoredSessionKey(ownerAddress, chain.id);
		if (!storedSessionKey) {
			logPlayback("session_key_not_found_locally", { smartAccountAddress });
			return authorizePlaybackSession(smartAccountAddress, target);
		}

		const session = await getCurrentSession(smartAccountAddress, storedSessionKey.address);
		const now = BigInt(Math.floor(Date.now() / 1000));
		const hasExpiredLocally = BigInt(storedSessionKey.validUntil) <= now;
		const isSessionUsable =
			session &&
			session.active &&
			session.target.toLowerCase() === target.toLowerCase() &&
			session.selector.toLowerCase() === WAVECOIN_BUY_PLAY_SELECTOR.toLowerCase() &&
			session.validUntil > now &&
			session.usedCalls < session.maxCalls &&
			!hasExpiredLocally;

		if (isSessionUsable) {
			logPlayback("session_key_reused", {
				smartAccountAddress,
				sessionKeyAddress: storedSessionKey.address,
				usedCalls: session.usedCalls,
				maxCalls: session.maxCalls
			});
			updateDebugState({
				smartAccountAddress,
				sessionKeyAddress: storedSessionKey.address,
				executionMode: "session-key"
			});
			return storedSessionKey;
		}

		logPlayback("session_key_invalidated", {
			smartAccountAddress,
			sessionKeyAddress: storedSessionKey.address,
			sessionActive: session?.active ?? false,
			hasExpiredLocally,
			onchainValidUntil: session?.validUntil?.toString() ?? null,
			usedCalls: session?.usedCalls ?? null,
			maxCalls: session?.maxCalls ?? null
		});
		clearStoredSessionKey(ownerAddress, chain.id);
		return authorizePlaybackSession(smartAccountAddress, target);
	};

	const playWithSmartAccount = async (song: SongFromPonder) => {
		if (!ownerAddress || !chain?.id || !walletClient || !publicClient || !wavecoinContract) {
			throw new Error("Smart account is not ready yet");
		}

		const smartAccountAddress = await getOrCreateSmartAccountAddress();
		updateDebugState({ smartAccountAddress });
		const data = getBuyPlayData(song.songId);
		const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
		const smartAccountWaveBalance = (await publicClient.readContract({
			address: wavecoinContract.address,
			abi: wavecoinContract.abi,
			functionName: "balanceOf",
			args: [smartAccountAddress]
		})) as bigint;
		const ownerWaveBalance = (await publicClient.readContract({
			address: wavecoinContract.address,
			abi: wavecoinContract.abi,
			functionName: "balanceOf",
			args: [ownerAddress]
		})) as bigint;

		logPlayback("wave_balances_checked", {
			smartAccountAddress,
			smartAccountWaveBalance: smartAccountWaveBalance.toString(),
			ownerWaveBalance: ownerWaveBalance.toString(),
			songId: song.songId
		});

		if (isPlaybackSessionsEnabled()) {
			setPlaybackStatus("Preparing your gasless playback session...");
			const sessionKey = await getOrCreatePlaybackSession(smartAccountAddress, wavecoinContract.address);
			const sessionAccount = privateKeyToAccount(sessionKey.privateKey);
			const sessionNonce = await publicClient.readContract({
				address: smartAccountAddress,
				abi: wave3SmartAccountAbi,
				functionName: "sessionNonces",
				args: [sessionKey.address]
			});

			const sessionSignature = await sessionAccount.signTypedData({
				domain: {
					name: "Wave3SmartAccount",
					version: "1",
					chainId: chain.id,
					verifyingContract: smartAccountAddress
				},
				types: {
					ExecuteSession: [
						{ name: "sessionKey", type: "address" },
						{ name: "target", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "dataHash", type: "bytes32" },
						{ name: "nonce", type: "uint256" },
						{ name: "deadline", type: "uint256" }
					]
				},
				primaryType: "ExecuteSession",
				message: {
					sessionKey: sessionKey.address,
					target: wavecoinContract.address,
					value: 0n,
					dataHash: keccak256(data),
					nonce: sessionNonce,
					deadline
				}
			});

			setPlaybackStatus("Sending gasless play transaction...");
			logPlayback("executing_with_session_key", {
				smartAccountAddress,
				sessionKeyAddress: sessionKey.address,
				songId: song.songId,
				sessionNonce: sessionNonce.toString()
			});
			const response = await fetch("/api/smart-account/relay", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "executeSession",
					chainId: chain.id,
					smartAccountAddress,
					sessionKey: sessionKey.address,
					target: wavecoinContract.address,
					value: "0",
					data,
					deadline: deadline.toString(),
					sessionSignature
				} satisfies SmartAccountExecuteSessionRequest)
			});

			const payload = await response.json();
			if (!response.ok) {
				clearStoredSessionKey(ownerAddress, chain.id);
				throw new Error(payload.error || "Failed to relay session transaction");
			}

			logPlayback("session_transaction_sent", {
				smartAccountAddress,
				sessionKeyAddress: sessionKey.address,
				relayHash: payload.hash
			});
			updateDebugState({
				smartAccountAddress,
				sessionKeyAddress: sessionKey.address,
				executionMode: "session-key",
				relayHash: payload.hash
			});
			return payload.hash as string;
		}

		setPlaybackStatus("Requesting wallet approval for smart account execution...");
		const nonce = await publicClient.readContract({
			address: smartAccountAddress,
			abi: wave3SmartAccountAbi,
			functionName: "nonce"
		});

		const signature = await walletClient.signTypedData({
			account: ownerAddress,
			domain: {
				name: "Wave3SmartAccount",
				version: "1",
				chainId: chain.id,
				verifyingContract: smartAccountAddress
			},
			types: {
				Execute: [
					{ name: "target", type: "address" },
					{ name: "value", type: "uint256" },
					{ name: "dataHash", type: "bytes32" },
					{ name: "nonce", type: "uint256" },
					{ name: "deadline", type: "uint256" }
				]
			},
			primaryType: "Execute",
			message: {
				target: wavecoinContract.address,
				value: 0n,
				dataHash: keccak256(data),
				nonce,
				deadline
			}
		});

		setPlaybackStatus("Sending gasless play transaction...");
		logPlayback("executing_with_owner_signature", {
			smartAccountAddress,
			songId: song.songId,
			nonce: nonce.toString()
		});
		const response = await fetch("/api/smart-account/relay", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "execute",
				chainId: chain.id,
				smartAccountAddress,
				target: wavecoinContract.address,
				value: "0",
				data,
				deadline: deadline.toString(),
				signature
			} satisfies SmartAccountExecuteRequest)
		});

		const payload = await response.json();
		if (!response.ok) {
			throw new Error(payload.error || "Failed to relay smart account transaction");
		}

		logPlayback("smart_account_transaction_sent", {
			smartAccountAddress,
			relayHash: payload.hash
		});
		updateDebugState({
			smartAccountAddress,
			executionMode: "smart-account",
			relayHash: payload.hash
		});
		return payload.hash as string;
	};

	const playSponsoredSong = async (song: SongFromPonder) => {
		if (!ownerAddress || !chain?.id) {
			notification.error("Wallet not connected");
			return;
		}

		try {
			setIsStartingPlayback(true);
			setPendingSongId(song.songId);
			setPlaybackStatus("Starting playback...");
			setDebugState({
				step: "starting",
				smartAccountAddress: null,
				sessionKeyAddress: null,
				executionMode: null,
				relayHash: null
			});
			logPlayback("play_requested", {
				songId: song.songId,
				smartAccountsEnabled: isSmartAccountEnabled(),
				playbackSessionsEnabled: isPlaybackSessionsEnabled()
			});

			if (isSmartAccountEnabled()) {
				await playWithSmartAccount(song);
			} else {
				setPlaybackStatus("Requesting wallet approval...");
				updateDebugState({ executionMode: "wallet" });
				logPlayback("executing_with_wallet", { songId: song.songId });
				await writeWavecoin({
					functionName: "buyPlay",
					args: [BigInt(song.songId)]
				});
			}

			setPlaybackStatus("Playback started");
			updateDebugState({ step: "completed" });
			logPlayback("play_started", {
				songId: song.songId
			});
			playInMusicPlayer(song);
		} catch (error) {
			console.error("Error playing song:", error);
			logPlayback("play_failed", {
				songId: song.songId,
				error: error instanceof Error ? error.message : "Unknown error"
			});
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			notification.error(`Failed to play song: ${errorMessage}`);
		} finally {
			setIsStartingPlayback(false);
			setPendingSongId(null);
			setTimeout(() => {
				setPlaybackStatus(null);
			}, 2000);
		}
	};

	return {
		isStartingPlayback,
		pendingSongId,
		playbackStatus,
		playbackDebugState: debugState,
		playSponsoredSong
	};
};
