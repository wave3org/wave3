"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SongSearchInput } from "~~/components/SongSearchInput";
import "~~/styles/home-page.css";
import { notification } from "~~/utils/scaffold-eth/notification";

const SearchBar = () => {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearchInputChange = (value: string) => {
		setSearchQuery(value);
	};

	const handleKeyDown = (key: string) => {
		if (key === "Enter") {
			redirectToSearchPage();
		}
	};

	const redirectToSearchPage = () => {
		const searchUrl: string = "/search?q=" + searchQuery;

		try {
			router.push(searchUrl);
		} catch (error) {
			console.error("Error searching song:", error);
			notification.error("Error searching song");
		}
	};

	return (
		<div className="search-bar-container">
			<SongSearchInput
				value={searchQuery}
				onChange={handleSearchInputChange}
				onKeyDown={handleKeyDown}
				placeholder="Search songs..."
			/>
		</div>
	);
};

export default SearchBar;
