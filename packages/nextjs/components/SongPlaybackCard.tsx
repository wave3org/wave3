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
				"overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md",
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
					<div className="flex h-64 w-full items-center justify-center bg-base-200 text-sm text-base-content/50">
						No cover available
					</div>
				)}
			</Link>

			<div className="space-y-4 p-4">
				<div className="space-y-1">
					<Link href={`/song/${song.songId}`} className="block">
						<h3 className="text-xl font-semibold text-base-content">{song.name}</h3>
						<p className="text-sm text-base-content/60">
							{song.album?.name || "Single"}
							{" · "}
							{song.album?.artist || "Unknown Artist"}
						</p>
					</Link>
				</div>

				<button type="button" onClick={() => onPlay(song)} disabled={disabled} className="btn btn-primary w-full gap-2">
					<FaPlay size={12} />
					<span>{disabled ? "Starting playback..." : "Play"}</span>
				</button>
			</div>
		</div>
	);
};
