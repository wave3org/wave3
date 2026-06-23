"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrentSongId } from "./MusicPlayer";
import { SearchBy } from "~~/types/songSearchSpec";

type SongCardProps = {
	songId: string;
	name: string;
	artist: string;
	imageUrl: string | null;
	actions: ReactNode;
	className?: string;
};

export const SongCard = ({ songId, name, artist, imageUrl, actions, className }: SongCardProps) => {
	const currentSongId = useCurrentSongId();
	const isPlaying = currentSongId === songId;

	return (
		<div
			className={[
				"flex flex-col overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md h-full",
				isPlaying ? "border-primary ring-2 ring-primary/40" : "border-base-300",
				"bg-base-100",
				className ?? ""
			]
				.filter(Boolean)
				.join(" ")}
		>
			<Link href={`/search?q=${name}&by=${SearchBy.Song}`} className="block relative">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={`${name} cover`}
						width={300}
						height={300}
						className="aspect-square w-full object-cover"
						unoptimized
					/>
				) : (
					<div className="flex aspect-square w-full items-center justify-center bg-base-200 text-sm text-base-content/50">
						No cover available
					</div>
				)}
				{isPlaying && (
					<div className="absolute bottom-1 right-1 flex items-center gap-[2px] rounded bg-primary px-1.5 py-0.5">
						<span className="inline-block w-[3px] h-3 bg-primary-content animate-bounce [animation-delay:0ms]"></span>
						<span className="inline-block w-[3px] h-3 bg-primary-content animate-bounce [animation-delay:150ms]"></span>
						<span className="inline-block w-[3px] h-3 bg-primary-content animate-bounce [animation-delay:300ms]"></span>
					</div>
				)}
			</Link>
			<div className="px-2 pb-2 pt-1">
				<Link href={`/search?q=${name}&by=${SearchBy.Song}`} className="block min-w-0">
					<h3 className="truncate text-sm font-bold text-base-content leading-tight">{name}</h3>
				</Link>
				<Link href={`/search?q=${artist}&by=${SearchBy.Artist}`}>
					<p className="truncate text-xs text-base-content/60 leading-tight">{artist}</p>
				</Link>
				<div className="mt-1">{actions}</div>
			</div>
		</div>
	);
};
