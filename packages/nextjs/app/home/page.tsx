"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Carrousel from "./_components/Carrousel";
import type { NextPage } from "next";
import { FaPlay } from "react-icons/fa";
import { SongPlaybackCard } from "~~/components/SongPlaybackCard";
import { useSponsoredSongPlayback } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import { type SongFromPonder, fetchSongsFromPonder } from "~~/services/songs/ponderSongService";
import "~~/styles/home-page.css";
import { notification } from "~~/utils/scaffold-eth/notification";

const Home: NextPage = () => {
	const [librarySongs, setLibrarySongs] = useState<SongFromPonder[]>([]);
	const [libraryLoading, setLibraryLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<SongFromPonder[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const { pendingSongId, playSponsoredSong } = useSponsoredSongPlayback();

	const showSearchResults = searchQuery.trim().length > 0;

	useEffect(() => {
		let cancelled = false;

		const loadLibrarySongs = async () => {
			setLibraryLoading(true);
			try {
				const fetchedSongs = await fetchSongsFromPonder();
				if (!cancelled) {
					setLibrarySongs(fetchedSongs);
				}
			} catch (error) {
				console.error("Failed to fetch songs for home page:", error);
				if (!cancelled) {
					notification.error("Failed to load songs from database");
					setLibrarySongs([]);
				}
			} finally {
				if (!cancelled) {
					setLibraryLoading(false);
				}
			}
		};

		void loadLibrarySongs();
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if (!showSearchResults) {
			setSearchResults([]);
			setSearchLoading(false);
			return;
		}

		let cancelled = false;

		const loadSearchResults = async () => {
			setSearchLoading(true);
			try {
				const fetchedSongs = await fetchSongsFromPonder(searchQuery);
				if (!cancelled) {
					setSearchResults(fetchedSongs);
				}
			} catch (error) {
				console.error("Failed to search songs:", error);
				if (!cancelled) {
					notification.error("Failed to load songs from database");
					setSearchResults([]);
				}
			} finally {
				if (!cancelled) {
					setSearchLoading(false);
				}
			}
		};

		const debounceTimer = setTimeout(() => {
			void loadSearchResults();
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(debounceTimer);
		};
	}, [searchQuery, showSearchResults]);

	const featuredSong = librarySongs[0] ?? null;
	const newReleases = useMemo(() => librarySongs.slice(1, 7), [librarySongs]);
	const trendingSongs = useMemo(() => {
		const secondarySlice = librarySongs.slice(7, 13);
		return secondarySlice.length > 0 ? secondarySlice : librarySongs.slice(1, 7);
	}, [librarySongs]);

	return (
		<>
			<div className="mb-8 px-4 pt-4">
				<input
					type="text"
					placeholder="Search songs by name..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			{showSearchResults ? (
				<div className="px-4 pb-10">
					<h2 className="mb-4 text-3xl font-bold">Search Results</h2>
					{searchLoading ? (
						<div className="py-12 text-center">
							<p className="text-xl text-gray-500">Loading songs...</p>
						</div>
					) : searchResults.length === 0 ? (
						<div className="py-12 text-center">
							<p className="text-xl text-gray-500">No songs found matching your search</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{searchResults.map(song => (
								<SongPlaybackCard
									key={song.songId}
									song={song}
									onPlay={playSponsoredSong}
									disabled={pendingSongId === song.songId}
								/>
							))}
						</div>
					)}
				</div>
			) : libraryLoading ? (
				<div className="px-4 py-12 text-center">
					<p className="text-xl text-gray-500">Loading home feed...</p>
				</div>
			) : librarySongs.length === 0 ? (
				<div className="px-4 py-12 text-center">
					<p className="text-xl text-gray-500">No songs available yet</p>
				</div>
			) : (
				<>
					{featuredSong && (
						<div className="featured-container">
							<Link href={`/song/${featuredSong.songId}`} className="block">
								{featuredSong.album?.imageCID ? (
									<Image
										src={getFileUrl(featuredSong.album.imageCID)}
										width={1200}
										height={400}
										alt={`${featuredSong.name} cover`}
									/>
								) : (
									<div className="flex h-48 items-center justify-center rounded-t-2xl bg-slate-100 text-slate-500">
										No cover available
									</div>
								)}
							</Link>

							<div className="featured-description">
								<div className="flex flex-col">
									<span>
										Featured Release: {featuredSong.name} by {featuredSong.album?.artist || "Unknown Artist"}
									</span>
									<span className="text-sm font-normal opacity-80">Album: {featuredSong.album?.name || "Single"}</span>
								</div>

								<button
									type="button"
									onClick={() => playSponsoredSong(featuredSong)}
									disabled={pendingSongId === featuredSong.songId}
									className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
								>
									<FaPlay size={12} />
									<span>{pendingSongId === featuredSong.songId ? "Starting..." : "Play"}</span>
								</button>
							</div>
						</div>
					)}

					<div className="carrousel-container">
						<Carrousel title="New Releases">
							{newReleases.map(song => (
								<SongPlaybackCard
									key={song.songId}
									song={song}
									onPlay={playSponsoredSong}
									disabled={pendingSongId === song.songId}
									className="min-w-[18rem]"
								/>
							))}
						</Carrousel>
					</div>

					<div className="carrousel-container">
						<Carrousel title="Trending on wave3">
							{trendingSongs.map(song => (
								<SongPlaybackCard
									key={song.songId}
									song={song}
									onPlay={playSponsoredSong}
									disabled={pendingSongId === song.songId}
									className="min-w-[18rem]"
								/>
							))}
						</Carrousel>
					</div>
				</>
			)}
		</>
	);
};

export default Home;
