"use client";

import Image from "next/image";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";
import { getFileUrl } from "~~/services/files/fileService";
import type { SongFromPonder } from "~~/services/songs/ponderSongService";

type SongPlaybackCardProps = {
	song: SongFromPonder;
	onPlay: (song: SongFromPonder) => Promise<void> | void;
	disabled?: boolean;
	className?: string;
};

export const SongPlaybackCard = ({ song, onPlay, disabled = false, className }: SongPlaybackCardProps) => {
	const albumImageUrl = song.album?.imageCID ? getFileUrl(song.album.imageCID) : null;

	return (
		<div
			className={[
				"overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md",
				className ?? ""
			]
				.filter(Boolean)
				.join(" ")}
		>
			<Link href={`/song/${song.songId}`} className="block">
				{albumImageUrl ? (
					<Image
						src={albumImageUrl}
						alt={`${song.name} cover`}
						width={400}
						height={256}
						className="h-64 w-full object-cover"
					/>
				) : (
					<div className="flex h-64 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
						No cover available
					</div>
				)}
			</Link>

			<div className="space-y-4 p-4">
				<div className="space-y-1">
					<Link href={`/song/${song.songId}`} className="block">
						<h3 className="text-xl font-semibold text-slate-900">{song.name}</h3>
						<p className="text-sm text-slate-500">
							{song.album?.name || "Single"}
							{" · "}
							{song.album?.artist || "Unknown Artist"}
						</p>
					</Link>
				</div>

				<button
					type="button"
					onClick={() => onPlay(song)}
					disabled={disabled}
					className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
				>
					<FaPlay size={12} />
					<span>{disabled ? "Starting playback..." : "Play"}</span>
				</button>
			</div>
		</div>
	);
};
