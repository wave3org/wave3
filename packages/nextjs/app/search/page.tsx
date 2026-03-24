"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { NextPage } from "next";
import { SongPlaybackCard } from "~~/components/SongPlaybackCard";
import { useSponsoredSongPlayback } from "~~/hooks/scaffold-eth";
import { type SongFromPonder, fetchSongsFromPonder } from "~~/services/songs/ponderSongService";
import { notification } from "~~/utils/scaffold-eth/notification";

const SearchPage: NextPage = () => {
	const searchParams = useSearchParams();
	const urlSearchQuery: string = searchParams.get("q")!;
	const [songs, setSongs] = useState<SongFromPonder[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
	const { pendingSongId, playSponsoredSong } = useSponsoredSongPlayback();

	useEffect(() => {
		let cancelled = false;

		const loadSongs = async () => {
			setLoading(true);
			try {
				const fetchedSongs = await fetchSongsFromPonder(searchQuery || undefined);
				if (!cancelled) {
					setSongs(fetchedSongs);
				}
			} catch (error) {
				console.error("Failed to fetch songs:", error);
				if (!cancelled) {
					notification.error("Failed to load songs from database");
					setSongs([]);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		const debounceTimer = setTimeout(() => {
			void loadSongs();
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(debounceTimer);
		};
	}, [searchQuery]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="mb-2 text-4xl font-bold">Search Songs</h1>
				<p className="text-gray-600">Browse the latest uploaded songs</p>
			</div>

			<div className="mb-6">
				<input
					type="text"
					placeholder="Search songs by name..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			{loading ? (
				<div className="py-12 text-center">
					<p className="text-xl text-gray-500">Loading songs...</p>
				</div>
			) : songs.length === 0 ? (
				<div className="py-12 text-center">
					<p className="text-xl text-gray-500">
						{searchQuery ? "No songs found matching your search" : "No songs uploaded yet"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{songs.map(song => (
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
	);
};

export default SearchPage;
