"use client";

import Image from "next/image";
import Link from "next/link";
import PlayButton from "../../../components/PlayButton";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";
import { SearchBy } from "~~/types/songSearchSpec";

interface FeaturedProps {
	songMetadata: SongMetadata | null;
}

const Featured = ({ songMetadata }: FeaturedProps) => {
	if (!songMetadata || typeof songMetadata === "string" || !songMetadata.album) return null;

	const coverUrl = songMetadata.album.imageCID ? getFileUrl(songMetadata.album.imageCID) : null;

	return (
		<div className="relative w-full rounded-xl overflow-hidden my-3" style={{ aspectRatio: "21/6", minHeight: "8rem" }}>
			{/* fondo borroso */}
			{coverUrl && (
				<Image
					src={coverUrl}
					alt=""
					fill
					className="object-cover scale-110 blur-sm opacity-40"
					sizes="100vw"
					priority
				/>
			)}
			{/* overlay oscuro */}
			<div className="absolute inset-0 bg-base-300/60" />
			{/* contenido */}
			<div className="absolute inset-0 flex items-center gap-6 px-6">
				<Link href={`/search?q=${songMetadata.name}&by=${SearchBy.Song}`} className="shrink-0">
					{coverUrl ? (
						<Image
							src={coverUrl}
							width={110}
							height={110}
							alt={songMetadata.album.name}
							className="rounded-lg shadow-lg object-cover"
						/>
					) : (
						<div className="w-[110px] h-[110px] rounded-lg bg-base-300 flex items-center justify-center text-base-content/40 text-xs">
							No cover
						</div>
					)}
				</Link>
				<div className="flex flex-col gap-1 min-w-0">
					<span className="text-xs text-base-content/50 uppercase tracking-widest">Featured Release</span>
					<Link href={`/search?q=${songMetadata.name}&by=${SearchBy.Song}`}>
						<h2 className="text-xl font-bold text-base-content truncate">{songMetadata.name}</h2>
					</Link>
					<Link href={`/search?q=${songMetadata.album.artist}&by=${SearchBy.Artist}`}>
						<span className="text-sm text-base-content/60">{songMetadata.album.artist}</span>
					</Link>
					<div className="mt-2">
						<PlayButton songMetadata={songMetadata} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Featured;
