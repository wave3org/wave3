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
				"flex flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md",
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
						width={300}
						height={300}
						className="aspect-square w-full object-cover"
					/>
				) : (
					<div className="flex aspect-square w-full items-center justify-center bg-base-200 text-sm text-base-content/50">
						No cover available
					</div>
				)}
			</Link>

			<div className="flex flex-col gap-2 p-3">
				<Link href={`/song/${song.songId}`} className="block min-w-0">
					<h3 className="truncate text-sm font-bold text-base-content">{song.name}</h3>
				</Link>
				<p className="truncate text-sm text-base-content/60">{song.album?.name || "Single"}</p>
				<button
					type="button"
					onClick={() => onPlay(song)}
					disabled={disabled}
					className="btn btn-primary btn-sm w-full gap-2"
				>
					<FaPlay size={12} />
					<span>{disabled ? "Starting playback..." : "Play"}</span>
				</button>
			</div>
		</div>
	);
};
