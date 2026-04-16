"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlayableSong from "~~/components/PlayableSong";
import { SongSearchInput } from "~~/components/SongSearchInput";
import { searchSongs } from "~~/services/search/searchService";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth/notification";

export function SearchContent() {
	const searchParams = useSearchParams();
	const urlSearchQuery: string = searchParams.get("q") || "";
	const [songs, setSongs] = useState<SongMetadata[] | null>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
	const [shouldReload, setShouldReload] = useState(true);

	const handleSearchInputChange = (value: string) => {
		setSearchQuery(value);
	};

	const handleKeyDown = (key: string) => {
		if (key === "Enter") {
			setShouldReload(true);
		}
	};

	useEffect(() => {
		const loadSongs = async () => {
			if (shouldReload) {
				setLoading(true);
				try {
					setSongs(await searchSongs(searchQuery));
				} catch (error) {
					console.error("Failed to fetch songs:", error);
					notification.error("Failed to load songs from database");
				}
				setLoading(false);
				setShouldReload(false);
			}
		};
		loadSongs();
	}, [shouldReload, searchQuery]);

	const renderSongs = () => {
		if (songs) {
			if (songs.length === 0) {
				return (
					<div className="py-12 text-center">
						<p className="text-xl text-base-content/50">
							{searchQuery ? "No songs found matching your search" : "No songs uploaded yet"}
						</p>
					</div>
				);
			} else {
				return (
					<div className="grid-container">
						{songs.map(song => (
							<div className="song-container" key={song.id}>
								<PlayableSong songMetadata={song} />
							</div>
						))}
					</div>
				);
			}
		} else {
			return <></>;
		}
	};

	return (
		<>
			<div className="title-container">
				<span className="title">Search Songs</span>
				<span className="info">Browse the latest uploaded songs</span>
			</div>

			<div className="search-bar-container">
				<SongSearchInput value={searchQuery} onChange={handleSearchInputChange} onKeyDown={handleKeyDown} />
			</div>

			<>
				{loading ? (
					<div className="py-12 text-center">
						<span className="loading loading-spinner loading-lg"></span>
					</div>
				) : (
					<>{renderSongs()}</>
				)}
			</>
		</>
	);
}
