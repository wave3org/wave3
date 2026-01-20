"use client";

import Image from "next/image";
import type { NextPage } from "next";
import { fetchSongsMetadata } from "~~/services/songs/songService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";

// TODO: FILTERS
const fetchFilterResults = (): SongMetadata[] => {
	return fetchSongsMetadata();
};

// TODO: SONG STATUS
// TODO: ROI
const RenderSong = (songMetadata: SongMetadata) => {
	return (
		<div className="marketplace-song-container" key={songMetadata.id}>
			<div className="song-card">
				<div className="song-thumbnail">
					<Image
						key={songMetadata.image.alt}
						src={songMetadata.image.src}
						width={songMetadata.image.width}
						height={songMetadata.image.height}
						alt={songMetadata.image.alt}
					/>
				</div>
				<div className="song-info">
					<span className="song-title">{songMetadata.title}</span>
					<span className="song-artist">{songMetadata.artist}</span>
				</div>
				<div className="song-controls">
					<span>PROGRESS BAR</span>
				</div>
				<div className="song-controls">
					<span>{songMetadata.price} ROI est: ???</span>
				</div>
				<div className="song-controls">
					<span>BOTON VER DETALLES</span>
				</div>
			</div>
		</div>
	);
};

const renderSongs = (songsMetadata: SongMetadata[]) => {
	const songs = [];

	for (const songMetadata of songsMetadata) {
		songs.push(RenderSong(songMetadata));
	}

	return <>{songs}</>;
};

const MarketplacePage: NextPage = () => {
	return (
		<div>
			<div>
				<span className="title">Marketplace de Canciones</span>
			</div>
			<div>
				<span className="info">Invertí en tus artistas favoritos adquiriendo una parte de sus regalías</span>
			</div>
			<div>
				<span>Buscador y filtros</span>
			</div>
			<div className="marketplace-container">{renderSongs(fetchFilterResults())}</div>
		</div>
	);
};

export default MarketplacePage;
