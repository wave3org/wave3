"use client";

import { useState } from "react";
import Grid from "./_components/Grid";
import ComponentWithLoading from "~~/components/ComponentWithLoading";
import { SongSearchBar } from "~~/components/SongSearchBar";
import { searchSongs } from "~~/services/search/searchService";
import { fetchSongPlaysStats } from "~~/services/songs/ponderSongService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { SongSearchSpec } from "~~/types/songSearchSpec";
import { notification } from "~~/utils/scaffold-eth";
import { SerializedSongMetadata, deserializeSong } from "~~/utils/songSerializer";

interface MarketplaceClientProps {
	initialSongs: SerializedSongMetadata[] | null;
	initialPlays30d: Record<string, number>;
}

export default function MarketplaceClient({ initialSongs, initialPlays30d }: MarketplaceClientProps) {
	const [songs, setSongs] = useState<SongMetadata[] | null>(initialSongs ? initialSongs.map(deserializeSong) : null);
	const [plays30dBySongId, setPlays30dBySongId] = useState<Map<string, number>>(
		new Map(Object.entries(initialPlays30d))
	);
	const [isLoading, setIsLoading] = useState(false);
	const [songSearchSpec, setSongSearchSpec] = useState<SongSearchSpec>({ query: "", searchBy: [] });

	const reload = async () => {
		setIsLoading(true);
		try {
			const [newSongs, newPlays] = await Promise.all([
				searchSongs(songSearchSpec),
				fetchSongPlaysStats(30).catch(() => new Map<string, number>())
			]);
			setSongs(newSongs);
			setPlays30dBySongId(newPlays);
		} catch (error) {
			console.error("Failed to reload songs:", error);
			notification.error("Failed to reload songs");
		}
		setIsLoading(false);
	};

	const handleOnEnterPressed = async (newSpec: SongSearchSpec) => {
		setSongSearchSpec(newSpec);
		setIsLoading(true);
		try {
			const newSongs = await searchSongs(newSpec);
			setSongs(newSongs);
		} catch (error) {
			console.error("Failed to fetch songs:", error);
			notification.error("Failed to fetch songs");
		}
		setIsLoading(false);
	};

	return (
		<>
			<div className="search-bar-container">
				<SongSearchBar onEnterPressed={handleOnEnterPressed} placeholder="Search songs to buy royalties..." />
			</div>

			<ComponentWithLoading isLoading={isLoading}>
				<Grid songsMetadata={songs} plays30dBySongId={plays30dBySongId} onChange={reload} />
			</ComponentWithLoading>
		</>
	);
}
