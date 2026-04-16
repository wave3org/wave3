"use client";

import { useEffect, useState } from "react";
import Grid from "./_components/Grid";
import { NextPage } from "next";
import ComponentWithLoading from "~~/components/ComponentWithLoading";
import { SongSearchInput } from "~~/components/SongSearchInput";
import { searchSongs } from "~~/services/search/searchService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth";

const MarketplacePage: NextPage = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [searchResults, setSearchResults] = useState<SongMetadata[] | null>(null);
	const [shouldReload, setShouldReload] = useState(true);

	const reload = () => {
		setShouldReload(true);
	};

	const handleSearchInputChange = (value: string) => {
		setSearchQuery(value);
	};

	const handleKeyDown = (key: string) => {
		if (key === "Enter") {
			setShouldReload(true);
		}
	};

	useEffect(() => {
		const fetchSongsForMarketplace = async () => {
			if (shouldReload) {
				setIsLoading(true);
				try {
					setSearchResults(await searchSongs(searchQuery));
				} catch (error) {
					console.error("Failed to fetch songs:", error);
					notification.error("Failed to fetch songs");
				}
				setIsLoading(false);
				setShouldReload(false);
			}
		};
		fetchSongsForMarketplace();
	}, [shouldReload, searchQuery]);

	return (
		<>
			<div className="title-container">
				<span className="title">Song Marketplace</span>
				<span className="info">Discover songs and buy royalty shares from your favorite artists.</span>
			</div>

			<div className="search-bar-container">
				<SongSearchInput
					value={searchQuery}
					onChange={handleSearchInputChange}
					onKeyDown={handleKeyDown}
					placeholder="Search songs to buy royalties..."
				/>
			</div>

			<ComponentWithLoading isLoading={isLoading}>
				<Grid songsMetadata={searchResults} onChange={reload} />
			</ComponentWithLoading>
		</>
	);
};

export default MarketplacePage;
