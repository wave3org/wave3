"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Howl } from "howler";
import { FaPause, FaPlay } from "react-icons/fa";

interface Song {
	id: string;
	title: string;
	artist: string;
	audioUrl: string;
	cover?: string;
}

let sound: Howl | null = null;
let setGlobalSong: ((song: Song | null) => void) | null = null;
let setGlobalPlaying: ((playing: boolean) => void) | null = null;

export function MusicPlayer() {
	const [song, setSong] = useState<Song | null>(null);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		setGlobalSong = setSong;
		setGlobalPlaying = setPlaying;
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
		<div className="fixed bottom-0 left-0 right-0 h-[70px] bg-base-300 border-t border-base-content/10 flex items-center px-4 gap-4 z-[1000]">
			{song.cover && <Image src={song.cover} alt="" width={50} height={50} className="rounded" />}

			<div className="flex-1 min-w-0">
				<div className="font-bold text-sm text-base-content truncate">{song.title}</div>
				<div className="text-xs text-base-content/60 truncate">{song.artist}</div>
			</div>

			<button onClick={toggle} className="btn btn-primary btn-circle btn-sm">
				{playing ? <FaPause size={14} /> : <FaPlay size={14} />}
			</button>

			<button onClick={close} className="btn btn-ghost btn-sm border border-base-content/20 rounded">
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
	if (setGlobalPlaying) setGlobalPlaying(true);
};
