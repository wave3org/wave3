"use client";

import Image from "next/image";
import Carrousel from "./_components/Carrousel";
import PlayButton from "./_components/PlayButton";
import type { NextPage } from "next";
import { getFileUrl } from "~~/services/files/fileService";
import { fetchFeatured, fetchNewReleases, fetchTrending } from "~~/services/recommendations/recomendationsService";
import "~~/styles/home-page.css";
import { SongMetadata } from "~~/types/songMetadata";

const renderSong = (songMetadata: SongMetadata) => {
	const songUrl: string = "/song/" + songMetadata.id;

	return (
		<div className="song-container" key={songMetadata.id}>
			<div className="song-card">
				<div className="song-thumbnail">
					<Image
						key={songMetadata.image.alt}
						src={getFileUrl(songMetadata.image.cid)}
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
					<PlayButton route={songUrl} />
				</div>
			</div>
		</div>
	);
};

const renderSongs = (songsMetadata: SongMetadata[]) => {
	const songs = [];

	for (const songMetadata of songsMetadata) {
		songs.push(renderSong(songMetadata));
	}

	return <>{songs}</>;
};

const renderFeatured = () => {
	const songMetadata: SongMetadata | null = fetchFeatured();

	if (songMetadata != null) {
		return (
			<div>
				<div className="featured-container">
					<Image
						key={songMetadata.image.alt}
						src={getFileUrl(songMetadata.image.cid)}
						width={songMetadata.image.width}
						height={songMetadata.image.height}
						alt={songMetadata.image.alt}
					/>
					<div className="featured-description">
						<span>
							Featured Release: {songMetadata.title} by {songMetadata.artist}
						</span>
						<div className="featured-controls">
							<PlayButton route={"/song/" + songMetadata.id} />
						</div>
					</div>
				</div>
			</div>
		);
	} else {
		return <></>;
	}
};

const renderNewReleases = () => {
	return renderSongs(fetchNewReleases());
};

const renderTrending = () => {
	return renderSongs(fetchTrending());
};

const Home: NextPage = () => {
	return (
		<>
			{renderFeatured()}
			<div className="carrousel-container">
				<Carrousel title="New Releases">{renderNewReleases()}</Carrousel>
			</div>
			<div className="carrousel-container">
				<Carrousel title="Trending on wave3">{renderTrending()}</Carrousel>
			</div>
		</>
	);
};

export default Home;
