"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

type SongCardProps = {
	songId: string;
	name: string;
	artist: string;
	imageUrl: string | null;
	action: ReactNode;
	className?: string;
};

export const SongCard = ({ songId, name, artist, imageUrl, action, className }: SongCardProps) => {
	return (
		<div
			className={[
				"flex flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md h-full",
				className ?? ""
			]
				.filter(Boolean)
				.join(" ")}
		>
			<Link href={`/song/${songId}`} className="block">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={`${name} cover`}
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
				<Link href={`/song/${songId}`} className="block min-w-0">
					<h3 className="truncate text-sm font-bold text-base-content">{name}</h3>
				</Link>
				<p className="truncate text-sm text-base-content/60">{artist}</p>
				{action}
			</div>
		</div>
	);
};
