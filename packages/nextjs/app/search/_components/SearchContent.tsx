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
				<h1 className="mb-2 text-4xl font-bold">Buscar Canciones</h1>
				<p className="text-base-content/60">Explorá las canciones subidas más recientes</p>
			</div>

			<div className="mb-6">
				<input
					type="text"
					placeholder="Buscar canciones por nombre..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className="input input-bordered w-full"
				/>
			</div>

			{loading ? (
				<div className="py-12 text-center">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : songs.length === 0 ? (
				<div className="py-12 text-center">
					<p className="text-xl text-base-content/50">
						{searchQuery ? "No se encontraron canciones" : "Todavía no hay canciones subidas"}
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
}
