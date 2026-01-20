"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import type { NextPage } from "next";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { fetchSongMetadata } from "~~/services/songs/songService";
import "~~/styles/home-page.css";
import "~~/styles/song-page.css";
import { SongMetadata } from "~~/types/songMetadata";

const SongPage: NextPage = () => {
	const params = useParams<{ id: string }>();
	const songMetadata: SongMetadata | null = fetchSongMetadata(params.id);

	if (songMetadata != null) {
		return (
			<>
				<div className="player-container">
					<div className="player-content">
						<Image
							key={songMetadata.id}
							src={songMetadata.image.src}
							width={songMetadata.image.width}
							height={songMetadata.image.height}
							alt={songMetadata.image.alt}
						/>
						<div className="song-info">
							<span className="song-title">{songMetadata.title}</span>
							<span className="song-artist">{songMetadata.artist}</span>
						</div>
						<AudioPlayer autoPlay={true} showJumpControls={false} src={songMetadata.url} customVolumeControls={[]} />
					</div>
				</div>
			</>
		);
	} else {
		// TODO: ERROR MESSAGE
		return <></>;
	}
};

export default SongPage;
