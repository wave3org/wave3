"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "./useScaffoldWriteContract";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { playSong } from "~~/components/MusicPlayer";
import deployedContracts from "~~/contracts/deployedContracts";
import { getFileUrl } from "~~/services/files/fileService";
import { payToPlaySong } from "~~/services/songs/playSongService";
import type { SongFromPonder } from "~~/services/songs/ponderSongService";
import { notification } from "~~/utils/scaffold-eth/notification";

export const useSponsoredSongPlayback = () => {
	const [isStartingPlayback, setIsStartingPlayback] = useState(false);
	const [pendingSongId, setPendingSongId] = useState<string | null>(null);
	const { address: ownerAddress, chain } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();
	const { writeContractAsync: writeWavecoin } = useScaffoldWriteContract({ contractName: "Wavecoin" });

	// Create a custom writeRoyalties function for the SongRoyalties contract
	const writeRoyalties = async (params: { functionName: "playSong"; args: [bigint] }) => {
		if (!walletClient || !publicClient) throw new Error("Wallet not connected");
		const contractsForNetwork = (deployedContracts as Record<number, Record<string, { address: `0x${string}` }>>)[
			chain?.id || 0
		];
		const royaltiesAddress = contractsForNetwork?.SongRoyalties?.address;
		if (!royaltiesAddress) throw new Error("SongRoyalties contract not deployed");

		const hash = await walletClient.writeContract({
			account: walletClient.account || ownerAddress,
			address: royaltiesAddress as `0x${string}`,
			abi: [
				{
					type: "function",
					stateMutability: "nonpayable",
					name: "playSong",
					inputs: [{ name: "songId", type: "uint256" }]
				}
			] as const,
			functionName: "playSong",
			args: params.args
		});
		return hash;
	};

	const playSponsoredSong = async (song: SongFromPonder) => {
		if (!publicClient || !ownerAddress || !chain?.id) {
			notification.error("Wallet not connected");
			return;
		}

		const contractsForNetwork = (deployedContracts as Record<number, Record<string, { address: `0x${string}` }>>)[
			chain.id
		];
		const wavecoinAddress = contractsForNetwork?.Wavecoin?.address;
		const royaltiesAddress = contractsForNetwork?.SongRoyalties?.address;

		if (!wavecoinAddress || !royaltiesAddress) {
			notification.error("Smart account playback contracts are not deployed for the selected network");
			return;
		}

		try {
			setIsStartingPlayback(true);
			setPendingSongId(song.songId);
			await payToPlaySong({
				songId: song.songId,
				ownerAddress,
				chainId: chain.id,
				wavecoinAddress,
				royaltiesAddress,
				writeWavecoin,
				writeRoyalties,
				publicClient,
				walletClient: walletClient ?? undefined
			});

			playSong({
				id: song.songId,
				title: song.name,
				artist: song.album?.artist || "Unknown Artist",
				audioUrl: getFileUrl(song.audioCID),
				cover: song.album?.imageCID ? getFileUrl(song.album.imageCID) : undefined
			});
		} catch (error) {
			console.error("Error playing song:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			notification.error(`Failed to play song: ${errorMessage}`);
		} finally {
			setIsStartingPlayback(false);
			setPendingSongId(null);
		}
	};

	return {
		isStartingPlayback,
		pendingSongId,
		playSponsoredSong
	};
};
