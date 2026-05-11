"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
let currentSongId: string | null = null;
const listeners = new Set<(id: string | null) => void>();

export function useCurrentSongId() {
	const [id, setId] = useState<string | null>(currentSongId);
	useEffect(() => {
		listeners.add(setId);
		return () => {
			listeners.delete(setId);
		};
	}, []);
	return id;
}

export function MusicPlayer() {
	const [song, setSong] = useState<Song | null>(null);
	const [playing, setPlaying] = useState(false);
	const [seek, setSeek] = useState(0);
	const [duration, setDuration] = useState(0);
	const rafRef = useRef<number>(0);

	const updateSeek = useCallback(() => {
		if (sound && sound.playing()) {
			setSeek(sound.seek());
			setDuration(sound.duration());
			cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(updateSeek);
		}
	}, []);

	useEffect(() => {
		setGlobalSong = setSong;
		setGlobalPlaying = (p: boolean) => {
			setPlaying(p);
			cancelAnimationFrame(rafRef.current);
			if (p) {
				rafRef.current = requestAnimationFrame(updateSeek);
			}
		};
		return () => cancelAnimationFrame(rafRef.current);
	}, [updateSeek]);

	const toggle = () => {
		if (!sound) return;
		if (playing) {
			sound.pause();
		} else {
			sound.play();
			cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(updateSeek);
		}
		setPlaying(!playing);
	};

	const close = () => {
		if (sound) sound.stop();
		cancelAnimationFrame(rafRef.current);
		setSong(null);
		setPlaying(false);
		setSeek(0);
		setDuration(0);
		currentSongId = null;
		listeners.forEach(fn => fn(null));
	};

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!sound || !duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		sound.seek(pct * duration);
		setSeek(pct * duration);
	};

	const formatTime = (s: number) => {
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, "0")}`;
	};

	if (!song) return null;

	const progress = duration > 0 ? (seek / duration) * 100 : 0;

	return (
		<div className="fixed bottom-0 left-0 right-0 bg-base-300 border-t border-base-content/10 z-[1000]">
			<div className="h-1 cursor-pointer" onClick={handleSeek}>
				<div className="h-full bg-base-content/20">
					<div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
				</div>
			</div>
			<div className="flex items-center px-4 h-[66px] gap-4">
				{song.cover && <Image src={song.cover} alt="" width={46} height={46} className="rounded" />}
				<div className="flex-1 min-w-0">
					<div className="font-bold text-sm text-base-content truncate">{song.title}</div>
					<div className="text-xs text-base-content/60 truncate">{song.artist}</div>
				</div>
				<span className="text-xs text-base-content/50 tabular-nums">
					{formatTime(seek)} / {formatTime(duration)}
				</span>
				<button onClick={toggle} className="btn btn-primary btn-circle btn-sm">
					{playing ? <FaPause size={14} /> : <FaPlay size={14} />}
				</button>
				<button onClick={close} className="btn btn-ghost btn-sm border border-base-content/20 rounded">
					✕
				</button>
			</div>
		</div>
	);
}

export const playSong = (s: Song) => {
	if (sound) sound.unload();
	sound = new Howl({ src: [s.audioUrl], html5: true });
	sound.on("play", () => {
		if (setGlobalPlaying) setGlobalPlaying(true);
	});
	sound.play();
	if (setGlobalSong) setGlobalSong(s);
	currentSongId = s.id;
	listeners.forEach(fn => fn(s.id));
};
