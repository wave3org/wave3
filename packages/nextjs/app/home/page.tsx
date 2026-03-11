"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Carrousel from "./_components/Carrousel";
import PlayButton from "./_components/PlayButton";
import type { NextPage } from "next";
import { FaPlay } from "react-icons/fa";
import { usePublicClient, useWriteContract } from "wagmi";
import { playSong } from "~~/components/MusicPlayer";
import { getFileUrl } from "~~/services/files/fileService";
import { fetchFeatured, fetchNewReleases, fetchTrending } from "~~/services/recommendations/recomendationsService";
import { payToPlaySong } from "~~/services/songs/playSongService";
import { type SongFromPonder, fetchSongsFromPonder } from "~~/services/songs/ponderSongService";
import "~~/styles/home-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth/notification";

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
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SongFromPonder[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [showSearchResults, setShowSearchResults] = useState(false);
	const { writeContractAsync } = useWriteContract();
	const publicClient = usePublicClient();

	useEffect(() => {
		const loadSongs = async () => {
			if (!searchQuery.trim()) {
				setSearchResults([]);
				setShowSearchResults(false);
				return;
			}

			setSearchLoading(true);
			setShowSearchResults(true);
			try {
				const fetchedSongs = await fetchSongsFromPonder(searchQuery);
				setSearchResults(fetchedSongs);
			} catch (error) {
				console.error("❌ Failed to fetch songs:", error);
				notification.error("Failed to load songs from database");
				setSearchResults([]);
			}
			setSearchLoading(false);
		};

		const debounceTimer = setTimeout(() => {
			loadSongs();
		}, 300);

		return () => clearTimeout(debounceTimer);
	}, [searchQuery]);

	return (
		<>
			{/* Search Bar */}
			<div className="mb-8 px-4 pt-4">
				<input
					type="text"
					placeholder="Search songs by name..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
				/>
			</div>

			{/* Search Results */}
			{showSearchResults ? (
				<div className="px-4 mb-8">
					<h2 className="text-3xl font-bold mb-4">Search Results</h2>
					{searchLoading ? (
						<div className="text-center py-12">
							<p className="text-xl text-gray-500">Loading songs...</p>
						</div>
					) : searchResults.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-xl text-gray-500">No songs found matching your search</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{searchResults.map(song => (
								<div
									key={song.audioCID}
									className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
								>
									{song.album?.imageCID && (
										<Image
											src={getFileUrl(song.album.imageCID)}
											alt={`${song.album.name} cover`}
											width={400}
											height={256}
											className="w-full h-64 object-cover"
										/>
									)}
									<div className="p-4">
										<div className="mb-3">
											<h3 className="text-xl font-semibold mb-1">{song.name}</h3>
											{song.album && <p className="text-sm text-gray-500">{song.album.name}</p>}
										</div>
										<button
											onClick={async () => {
												try {
													if (!writeContractAsync || !publicClient) {
														notification.error("Wallet not connected");
														return;
													}
													await payToPlaySong(song.songId, writeContractAsync, publicClient);
													playSong({
														id: song.songId,
														title: song.name,
														artist: song.album?.artist || "Unknown Artist",
														audioUrl: getFileUrl(song.audioCID),
														cover: song.album?.imageCID ? getFileUrl(song.album.imageCID) : undefined
													});
												} catch (e) {
													console.error("Error playing song:", e);
													const errorMessage = e instanceof Error ? e.message : "Unknown error";
													notification.error(`Failed to play song: ${errorMessage}`);
												}
											}}
											style={{
												width: "100%",
												padding: "0.75rem",
												background: "#4f46e5",
												color: "white",
												border: "none",
												borderRadius: "0.5rem",
												cursor: "pointer",
												fontSize: "1rem",
												fontWeight: "500",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												gap: "0.5rem"
											}}
										>
											<FaPlay size={12} /> Play
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			) : (
				<>
					{/* Featured and Carousels */}
					{renderFeatured()}
					<div className="carrousel-container">
						<Carrousel title="New Releases">{renderNewReleases()}</Carrousel>
					</div>
					<div className="carrousel-container">
						<Carrousel title="Trending on wave3">{renderTrending()}</Carrousel>
					</div>
				</>
			)}
		</>
	);
};

export default Home;
