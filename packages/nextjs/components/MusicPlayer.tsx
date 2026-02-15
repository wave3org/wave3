"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Howl } from "howler";
import { FaPause, FaPlay } from "react-icons/fa";

interface Song {
	title: string;
	artist: string;
	audioUrl: string;
	cover?: string;
}

let sound: Howl | null = null;
let setGlobalSong: ((song: Song | null) => void) | null = null;

export function MusicPlayer() {
	const [song, setSong] = useState<Song | null>(null);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		setGlobalSong = setSong;
	}, []);

	const toggle = () => {
		if (!sound) return;
		if (playing) sound.pause();
		else sound.play();
		setPlaying(!playing);
	};

	const close = () => {
		if (sound) sound.stop();
		setSong(null);
		setPlaying(false);
	};

	if (!song) return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: 0,
				left: 0,
				right: 0,
				height: "70px",
				background: "#1a1a1a",
				borderTop: "1px solid #333",
				display: "flex",
				alignItems: "center",
				padding: "0 1rem",
				gap: "1rem",
				zIndex: 1000
			}}
		>
			{song.cover && <Image src={song.cover} alt="" width={50} height={50} style={{ borderRadius: "4px" }} />}

			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontWeight: "bold",
						fontSize: "0.9rem",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap"
					}}
				>
					{song.title}
				</div>
				<div
					style={{
						fontSize: "0.8rem",
						color: "#888",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap"
					}}
				>
					{song.artist}
				</div>
			</div>

			<button
				onClick={toggle}
				style={{
					background: "#4f46e5",
					border: "none",
					borderRadius: "50%",
					width: "40px",
					height: "40px",
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				}}
			>
				{playing ? <FaPause size={14} color="white" /> : <FaPlay size={14} color="white" />}
			</button>

			<button
				onClick={close}
				style={{
					background: "transparent",
					border: "1px solid #333",
					borderRadius: "4px",
					padding: "0.5rem 1rem",
					cursor: "pointer",
					color: "white"
				}}
			>
				✕
			</button>
		</div>
	);
}

export const playSong = (s: Song) => {
	if (sound) sound.unload();
	sound = new Howl({ src: [s.audioUrl], html5: true });
	sound.play();
	if (setGlobalSong) setGlobalSong(s);
};
