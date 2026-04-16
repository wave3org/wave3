"use client";

import PlayButton from "./PlayButton";
import { SongCard } from "./SongCard";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";

type SongProps = {
	songMetadata: SongMetadata;
};

const PlayableSong = ({ songMetadata }: SongProps) => {
	return (
		<SongCard
			songId={String(songMetadata.id)}
			name={songMetadata.name}
			artist={songMetadata.album.artist}
			imageUrl={getFileUrl(songMetadata.album.imageCID)}
			actions={<PlayButton songMetadata={songMetadata} />}
		/>
	);
};

export default PlayableSong;
