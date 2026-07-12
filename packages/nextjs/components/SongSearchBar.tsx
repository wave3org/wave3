"use client";

import { useState } from "react";
import { SearchBarIcon } from "./SearchBarIcon";
import { FunnelIcon } from "@heroicons/react/24/outline";
import "~~/styles/search-bar.css";
import { SearchBy, SongSearchSpec } from "~~/types/songSearchSpec";

type SongSearchBarProps = {
	onEnterPressed: (songSearchSpec: SongSearchSpec) => void;
	placeholder?: string;
};

export function SongSearchBar({ onEnterPressed, placeholder = "Search songs by name..." }: SongSearchBarProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [searchBy, setSearchBy] = useState({
		SONG: false,
		ALBUM: false,
		ARTIST: false,
		GENRE: false
	});

	const getToggleClassName = (toggled: boolean): string => {
		return toggled ? "search-bar-toggle-toggled" : "search-bar-toggle";
	};

	const buildSearchSpec = (): SongSearchSpec => {
		const searchSpec: SongSearchSpec = {
			query: searchQuery,
			searchBy: []
		};

		if (showFilters) {
			for (const key in searchBy) {
				if (searchBy[key as SearchBy] === true) {
					searchSpec.searchBy.push(key as SearchBy);
				}
			}
		}

		return searchSpec;
	};

	const handleOnKeyDown = (key: string) => {
		if (key === "Enter") {
			onEnterPressed(buildSearchSpec());
		}
	};

	const handleClick = (value: SearchBy) => {
		setSearchBy(prev => ({
			...prev,
			[value]: !prev[value]
		}));
	};

	return (
		<div className="flex flex-col w-full gap-2 relative">
			<div className="song-search-bar-main-container items-center">
				<div className="song-search-bar-input-container">
					<input
						type="text"
						placeholder={placeholder}
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						onKeyDown={e => handleOnKeyDown(e.key)}
						className="song-search-bar-input"
					/>
					<SearchBarIcon className="song-search-bar-input-icon" />
				</div>
				<button
					className={`btn btn-circle btn-sm ${showFilters ? "btn-info" : "btn-ghost"}`}
					onClick={() => setShowFilters(!showFilters)}
					title="Filters"
				>
					<FunnelIcon className="h-5 w-5" />
				</button>
			</div>
			{showFilters && (
				<div className="flex flex-row flex-wrap w-full justify-start gap-2 mt-2 p-4 bg-base-200 rounded-2xl shadow-lg border border-base-300">
					<span className="w-full text-sm font-semibold mb-2">Search In:</span>
					<button className={getToggleClassName(searchBy[SearchBy.Song])} onClick={() => handleClick(SearchBy.Song)}>
						<span>Song</span>
					</button>
					<button className={getToggleClassName(searchBy[SearchBy.Album])} onClick={() => handleClick(SearchBy.Album)}>
						<span>Album</span>
					</button>
					<button
						className={getToggleClassName(searchBy[SearchBy.Artist])}
						onClick={() => handleClick(SearchBy.Artist)}
					>
						<span>Artist</span>
					</button>
					<button className={getToggleClassName(searchBy[SearchBy.Genre])} onClick={() => handleClick(SearchBy.Genre)}>
						<span>Genre</span>
					</button>
				</div>
			)}
		</div>
	);
}
