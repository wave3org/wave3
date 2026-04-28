"use client";

import { useState } from "react";
import { SearchBarIcon } from "./SearchBarIcon";
import "~~/styles/search-bar.css";
import { SearchBy, SongSearchSpec } from "~~/types/songSearchSpec";

type SongSearchBarProps = {
	onEnterPressed: (songSearchSpec: SongSearchSpec) => void;
	placeholder?: string;
};

export function SongSearchBar({ onEnterPressed, placeholder = "Search songs by name..." }: SongSearchBarProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [togglesSelected, setTogglesSelected] = useState(1);
	const [searchBy, setSearchBy] = useState({
		SONG: true,
		ALBUM: false,
		ARTIST: false,
		GENRE: false
	});

	const getToggleClassName = (toggled: boolean): string => {
		let className: string = "search-bar-toggle";

		if (toggled) {
			className += "-toggled";
		}

		return className;
	};

	const buildSearchSpec = (): SongSearchSpec => {
		const searchSpec: SongSearchSpec = {
			query: searchQuery,
			searchBy: []
		};

		for (const key in searchBy) {
			if (searchBy[key as SearchBy] === true) {
				searchSpec.searchBy.push(key as SearchBy);
			}
		}

		return searchSpec;
	};

	const handleOnKeyDown = (key: string) => {
		if (key === "Enter") {
			onEnterPressed(buildSearchSpec());
		}
	};

	const handleClick = async (value: SearchBy) => {
		const updated = {
			...searchBy
		};

		if (updated[value] === false) {
			updated[value] = true;
			setSearchBy(updated);
			setTogglesSelected(togglesSelected + 1);
		} else {
			if (togglesSelected > 1) {
				updated[value] = false;
				setSearchBy(updated);
				setTogglesSelected(togglesSelected - 1);
			}
		}
	};

	return (
		<>
			<div className="song-search-bar-main-container">
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
				<div className="song-search-bar-toggles-container">
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
			</div>
		</>
	);
}
