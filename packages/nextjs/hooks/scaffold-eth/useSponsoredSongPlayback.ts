"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "./useScaffoldWriteContract";
import { useAccount } from "wagmi";
import { playSong } from "~~/components/MusicPlayer";
import { getFileUrl } from "~~/services/files/fileService";
import type { SongFromPonder } from "~~/services/songs/ponderSongService";
import { notification } from "~~/utils/scaffold-eth/notification";

/**
 * Hook for playing a song by calling Wavecoin.buyPlay(songId).
 * Handles loading state and music player integration.
 *
 * @returns pendingSongId - the song currently being purchased, or null
 * @returns playSponsoredSong - function to buy a play and start playback
 */
export const useSponsoredSongPlayback = () => {
	const [isStartingPlayback, setIsStartingPlayback] = useState(false);
	const [pendingSongId, setPendingSongId] = useState<string | null>(null);
	const { address: ownerAddress, chain } = useAccount();
	const { writeContractAsync: writeWavecoin } = useScaffoldWriteContract({ contractName: "Wavecoin" });

	/**
	 * Pays for a song play via Wavecoin.buyPlay and starts audio playback.
	 *
	 * @param song - the song metadata from ponder (songId, name, audioCID, album)
	 */
	const playSponsoredSong = async (song: SongFromPonder) => {
		if (!ownerAddress || !chain?.id) {
			notification.error("Wallet not connected");
			return;
		}

		try {
			setIsStartingPlayback(true);
			setPendingSongId(song.songId);

			await writeWavecoin({
				functionName: "buyPlay",
				args: [BigInt(song.songId)]
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
