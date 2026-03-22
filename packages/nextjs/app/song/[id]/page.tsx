"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { NextPage } from "next";
import { FaPlay } from "react-icons/fa";
import { useSponsoredSongPlayback } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import { type SongFromPonder, fetchSongFromPonder } from "~~/services/songs/ponderSongService";
import "~~/styles/song-page.css";
import { notification } from "~~/utils/scaffold-eth/notification";

const SongPage: NextPage = () => {
	const params = useParams<{ id: string }>();
	const [song, setSong] = useState<SongFromPonder | null>(null);
	const [loading, setLoading] = useState(true);
	const { pendingSongId, playSponsoredSong } = useSponsoredSongPlayback();

	useEffect(() => {
		let cancelled = false;
		const songId = Array.isArray(params.id) ? params.id[0] : params.id;

		if (!songId) {
			setSong(null);
			setLoading(false);
			return;
		}

		const loadSong = async () => {
			setLoading(true);
			try {
				const fetchedSong = await fetchSongFromPonder(songId);
				if (!cancelled) {
					setSong(fetchedSong);
				}
			} catch (error) {
				console.error("Failed to fetch song:", error);
				if (!cancelled) {
					notification.error("Failed to load song details");
					setSong(null);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void loadSong();
		return () => {
			cancelled = true;
		};
	}, [params.id]);

	if (loading) {
		return (
			<div className="player-container">
				<div className="player-content">
					<p className="text-lg text-slate-500">Loading song...</p>
				</div>
			</div>
		);
	}

	if (!song) {
		return (
			<div className="player-container">
				<div className="player-content gap-4 text-center">
					<p className="text-lg text-slate-500">Song not found.</p>
					<Link href="/search" className="rounded-lg bg-indigo-600 px-4 py-2 text-white">
						Back to search
					</Link>
				</div>
			</div>
		);
	}

	const coverUrl = song.album?.imageCID ? getFileUrl(song.album.imageCID) : null;

	return (
		<div className="player-container">
			<div className="player-content gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
				{coverUrl ? (
					<Image
						src={coverUrl}
						width={640}
						height={640}
						alt={`${song.name} cover`}
						className="rounded-2xl object-cover"
					/>
				) : (
					<div className="flex h-80 w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
						No cover available
					</div>
				)}

				<div className="flex w-full flex-col gap-2 text-center">
					<h1 className="text-3xl font-bold text-slate-900">{song.name}</h1>
					<p className="text-base text-slate-500">{song.album?.artist || "Unknown Artist"}</p>
					<p className="text-sm text-slate-400">Album: {song.album?.name || "Single"}</p>
				</div>

				<button
					type="button"
					onClick={() => playSponsoredSong(song)}
					disabled={pendingSongId === song.songId}
					className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
				>
					<FaPlay size={12} />
					<span>{pendingSongId === song.songId ? "Starting playback..." : "Play with sponsored gas"}</span>
				</button>

				<p className="text-center text-sm text-slate-500">
					The payment flow runs through the smart account relay. If session keys are enabled, only the first play needs
					owner approval.
				</p>
			</div>
		</div>
	);
};

export default SongPage;
