"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PlayableSong from "~~/components/PlayableSong";
import { SongSearchBar } from "~~/components/SongSearchBar";
import { searchSongs } from "~~/services/search/searchService";
import { SongMetadata } from "~~/types/songMetadata";
import { SearchBy, SongSearchSpec } from "~~/types/songSearchSpec";
import { notification } from "~~/utils/scaffold-eth/notification";

export function SearchContent() {
	const searchParams = useSearchParams();
	const urlSearchQuery: string = searchParams.get("q") || "";
	const urlSearchBy: SearchBy[] = (searchParams.get("by") || "").split(",").filter(Boolean) as SearchBy[];

	const [songs, setSongs] = useState<SongMetadata[] | null>([]);
	const [loading, setLoading] = useState(true);
	const [songSearchSpec, setSongSearchSpec] = useState<SongSearchSpec>({
		query: urlSearchQuery,
		searchBy: urlSearchBy
	});

	const [shouldReload, setShouldReload] = useState(true);

	// Sync state when URL params change (e.g. clicking an artist/song card)
	useEffect(() => {
		setSongSearchSpec({ query: urlSearchQuery, searchBy: urlSearchBy });
		setShouldReload(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [urlSearchQuery, searchParams.get("by")]);

	const handleOnEnterPressed = (songSearchSpec: SongSearchSpec) => {
		setSongSearchSpec(songSearchSpec);
		setShouldReload(true);
	};

	useEffect(() => {
		const loadSongs = async () => {
			if (shouldReload) {
				setLoading(true);
				try {
					setSongs(await searchSongs(songSearchSpec));
				} catch (error) {
					console.error("Failed to fetch songs:", error);
					notification.error("Failed to load songs from database");
				}
				setLoading(false);
				setShouldReload(false);
			}
		};
		loadSongs();
	}, [shouldReload, songSearchSpec]);

	const renderSongs = () => {
		if (songs) {
			if (songs.length === 0) {
				return (
					<div className="py-12 text-center">
						<p className="text-xl text-base-content/50">
							{songSearchSpec.query ? "No songs found matching your search" : "No songs uploaded yet"}
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
				<SongSearchBar onEnterPressed={handleOnEnterPressed} placeholder="Search" />
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
