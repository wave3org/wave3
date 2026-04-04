"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SongPlaybackCard } from "~~/components/SongPlaybackCard";
import { useSponsoredSongPlayback } from "~~/hooks/scaffold-eth";
import { type SongFromPonder, fetchSongsFromPonder } from "~~/services/songs/ponderSongService";
import { notification } from "~~/utils/scaffold-eth/notification";

export function SearchContent() {
	const searchParams = useSearchParams();
	const urlSearchQuery: string = searchParams.get("q") || "";
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
				<p className="text-base-content/60">Browse the latest uploaded songs</p>
			</div>

			<div className="mb-6">
				<div className="relative">
					<input
						type="text"
						placeholder="Search songs by name..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						className="input input-bordered w-full pr-10"
					/>
					<span className="absolute right-0 top-0 flex h-full items-center px-3 text-base-content/50">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</span>
				</div>
			</div>

			{loading ? (
				<div className="py-12 text-center">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : songs.length === 0 ? (
				<div className="py-12 text-center">
					<p className="text-xl text-base-content/50">
						{searchQuery ? "No songs found matching your search" : "No songs uploaded yet"}
					</p>
				</div>
			) : (
				<div className="flex flex-wrap">
					{songs.map(song => (
						<div key={song.songId} className="w-40 flex-shrink-0 p-1">
							<SongPlaybackCard song={song} onPlay={playSponsoredSong} disabled={pendingSongId === song.songId} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}
