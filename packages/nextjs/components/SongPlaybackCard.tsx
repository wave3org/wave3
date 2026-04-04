"use client";

import { SongCard } from "./SongCard";
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
		<SongCard
			songId={song.songId}
			name={song.name}
			artist={song.album?.artist || "Unknown Artist"}
			imageUrl={albumImageUrl}
			className={className}
			action={
				<button
					type="button"
					onClick={() => onPlay(song)}
					disabled={disabled}
					className="btn btn-primary btn-sm w-full gap-2"
				>
					<FaPlay size={12} />
					<span>{disabled ? "Starting playback..." : "Play"}</span>
				</button>
			}
		/>
	);
};
