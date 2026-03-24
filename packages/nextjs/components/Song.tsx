"use client";

import Image from "next/image";
import PlayButton from "./PlayButton";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";

type SongProps = {
	songMetadata: SongMetadata;
};

const Song = ({ ...props }: SongProps) => {
	const songMetadata: SongMetadata = props.songMetadata;

	return (
		<div className="song-card">
			<div className="song-thumbnail">
				<Image
					key={songMetadata.id}
					src={getFileUrl(songMetadata.album.imageCID)}
					width={230}
					height={230}
					alt={songMetadata.album.name}
				/>
			</div>
			<div className="song-info">
				<span className="song-title">{songMetadata.name}</span>
				<span className="song-artist">{songMetadata.album.artist}</span>
			</div>
			<div className="song-controls">
				<PlayButton songMetadata={songMetadata} />
			</div>
		</div>
	);
};

export default Song;
