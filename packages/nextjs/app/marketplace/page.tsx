"use client";

import { useEffect, useState } from "react";
import Grid from "./_components/Grid";
import { NextPage } from "next";
import ComponentWithLoading from "~~/components/ComponentWithLoading";
import { SongSearchBar } from "~~/components/SongSearchBar";
import { searchSongs } from "~~/services/search/searchService";
import { fetchSongPlaysStats } from "~~/services/songs/ponderSongService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { SongSearchSpec } from "~~/types/songSearchSpec";
import { notification } from "~~/utils/scaffold-eth";

const MarketplacePage: NextPage = () => {
	const [songSearchSpec, setSongSearchSpec] = useState<SongSearchSpec>({
		query: "",
		searchBy: []
	});
	const [isLoading, setIsLoading] = useState(true);
	const [searchResults, setSearchResults] = useState<SongMetadata[] | null>(null);
	const [plays30dBySongId, setPlays30dBySongId] = useState<Map<string, number>>(new Map());
	const [shouldReload, setShouldReload] = useState(true);

	const reload = () => {
		setShouldReload(true);
	};

	const handleOnEnterPressed = (songSearchSpec: SongSearchSpec) => {
		setSongSearchSpec(songSearchSpec);
		setShouldReload(true);
	};

	useEffect(() => {
		const fetchSongsForMarketplace = async () => {
			if (shouldReload) {
				setIsLoading(true);
				try {
					const [songs, playsMap] = await Promise.all([
						searchSongs(songSearchSpec),
						fetchSongPlaysStats(30).catch(() => new Map<string, number>())
					]);
					setSearchResults(songs);
					setPlays30dBySongId(playsMap);
				} catch (error) {
					console.error("Failed to fetch songs:", error);
					notification.error("Failed to fetch songs");
				}
				setIsLoading(false);
				setShouldReload(false);
			}
		};
		fetchSongsForMarketplace();
	}, [shouldReload, songSearchSpec]);

	return (
		<>
			<div className="title-container">
				<span className="title">Song Marketplace</span>
				<span className="info">Discover songs and buy royalty shares from your favorite artists.</span>
			</div>

			<div className="search-bar-container">
				<SongSearchBar onEnterPressed={handleOnEnterPressed} placeholder="Search songs to buy royalties..." />
			</div>

			<ComponentWithLoading isLoading={isLoading}>
				<Grid songsMetadata={searchResults} plays30dBySongId={plays30dBySongId} onChange={reload} />
			</ComponentWithLoading>
		</>
	);
};

export default MarketplacePage;
