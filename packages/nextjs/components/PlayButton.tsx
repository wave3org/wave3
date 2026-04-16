"use client";

import ComponentWithLoading from "./ComponentWithLoading";
import { playSong, useCurrentSongId } from "./MusicPlayer";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth";

interface PlayButtonProps {
	songMetadata: SongMetadata;
}

const PlayButton = ({ songMetadata }: PlayButtonProps) => {
	const currentSongId: string | null = useCurrentSongId();
	const isPlaying = currentSongId === String(songMetadata.id);
	const { writeContractAsync: writeWavecoinAsync, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const handleClick = async () => {
		try {
			await writeWavecoinAsync({
				functionName: "buyPlay",
				args: [songMetadata.id]
			});
			playSong({
				id: String(songMetadata.id),
				title: songMetadata.name,
				artist: songMetadata.album.artist,
				audioUrl: getFileUrl(songMetadata.audioCID),
				cover: getFileUrl(songMetadata.album.imageCID)
			});
		} catch (error) {
			console.error("Error buying play:", error);
			notification.error("Error buying play");
		}
	};

	const getText = (): string => {
		if (isPlaying) {
			return "Playing";
		} else {
			return "Play";
		}
	};

	return (
		<>
			<ComponentWithLoading isLoading={isPending}>
				<button className="primary-button" disabled={isPlaying} onClick={() => handleClick()}>
					<span>{getText()}</span>
				</button>
			</ComponentWithLoading>
		</>
	);
};

export default PlayButton;
