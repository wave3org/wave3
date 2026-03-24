"use client";

import { playSong } from "./MusicPlayer";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth";

interface PlayButtonProps {
	songMetadata: SongMetadata;
}

const PlayButton = ({ ...props }: PlayButtonProps) => {
	const songMetadata: SongMetadata = props.songMetadata;

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
			console.error("❌ Error buying play:", error);
			notification.error("Error buying play");
		}
	};

	return (
		<>
			{isPending ? (
				<span className="loading loading-spinner"></span>
			) : (
				<button className="primary-button" onClick={() => handleClick()}>
					<span>Play</span>
				</button>
			)}
		</>
	);
};

export default PlayButton;
