"use client";

import ComponentWithLoading from "./ComponentWithLoading";
import { useCurrentSongId } from "./MusicPlayer";
import { useSponsoredSongPlayback } from "~~/hooks/scaffold-eth";
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
		} catch (error) {
			console.error("Error buying play:", error);
			notification.error("Error buying play");
		}
	};

	const getText = () => {
		if (isPendingSong && playbackStatus) {
			return "Starting...";
		}

		if (isPlaying) {
			return "Playing";
		}

		return "Play";
	};

	return (
		<ComponentWithLoading isLoading={isStartingPlayback && isPendingSong}>
			<div className="flex flex-col items-center gap-2">
				<button className="primary-button" disabled={isPlaying} onClick={() => handleClick()}>
					<span>{getText()}</span>
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
