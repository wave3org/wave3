"use client";

import ComponentWithLoading from "./ComponentWithLoading";
import { useCurrentSongId } from "./MusicPlayer";
import { formatUnits } from "viem";
import { useSponsoredSongPlayback } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth";

interface PlayButtonProps {
	songMetadata: SongMetadata;
}

const PlayButton = ({ songMetadata }: PlayButtonProps) => {
	const currentSongId: string | null = useCurrentSongId();
	const isPlaying = currentSongId === String(songMetadata.id);
	const { playSponsoredSong, pendingSongId, isStartingPlayback, playbackStatus, playbackDebugState } =
		useSponsoredSongPlayback();
	const isPendingSong = pendingSongId === String(songMetadata.id);

	const handleClick = async () => {
		const prefetch = new Audio();
		prefetch.preload = "auto";
		prefetch.src = getFileUrl(songMetadata.audioCID);
		try {
			await playSponsoredSong({
				songId: String(songMetadata.id),
				name: songMetadata.name,
				audioCID: songMetadata.audioCID,
				album: {
					name: songMetadata.album.name,
					artist: songMetadata.album.artist,
					imageCID: songMetadata.album.imageCID
				}
			});
			const waveAmount = formatUnits(songMetadata.playFee, 18);
			notification.success(`🎵 −${waveAmount} WAVE deducted from your account`);
		} catch (error) {
			console.error("Error buying play:", error);
			notification.error("Error buying play");
		}
	};

	const playFeeDisplay = formatUnits(songMetadata.playFee, 18).replace(/\.0+$/, "");

	const getContent = () => {
		if (isPendingSong && playbackStatus) {
			return <span>Starting...</span>;
		}
		if (isPlaying) {
			return (
				<span className="flex items-center gap-1.5">
					<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
						<rect x="1" y="1" width="3" height="8" rx="1" />
						<rect x="6" y="1" width="3" height="8" rx="1" />
					</svg>
					Playing
				</span>
			);
		}
		return (
			<span className="flex items-center gap-1.5">
				<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
					<polygon points="1,1 9,5 1,9" />
				</svg>
				{playFeeDisplay} WAVE
			</span>
		);
	};

	return (
		<ComponentWithLoading isLoading={isStartingPlayback && isPendingSong}>
			<div className="flex flex-col items-center gap-2">
				<button className="primary-button" disabled={isPlaying || isStartingPlayback} onClick={() => handleClick()}>
					{getContent()}
				</button>
				{isPendingSong && playbackStatus ? (
					<div className="max-w-xs text-center text-xs text-base-content/70">{playbackStatus}</div>
				) : null}
				{isPendingSong && playbackDebugState.relayHash ? (
					<div className="max-w-xs text-center text-[10px] text-base-content/50">
						Relay tx: {playbackDebugState.relayHash.slice(0, 10)}...
					</div>
				) : null}
			</div>
		</ComponentWithLoading>
	);
};

export default PlayButton;
