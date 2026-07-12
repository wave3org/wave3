"use client";

import { useRouter } from "next/navigation";
import { SongSearchBar } from "~~/components/SongSearchBar";
import "~~/styles/home-page.css";
import { SongSearchSpec } from "~~/types/songSearchSpec";
import { notification } from "~~/utils/scaffold-eth/notification";

const SearchBar = () => {
	const router = useRouter();

	const handleOnEnterPressed = (songSearchSpec: SongSearchSpec) => {
		redirectToSearchPage(songSearchSpec);
	};

	const redirectToSearchPage = (songSearchSpec: SongSearchSpec) => {
		const params = new URLSearchParams();

		try {
			params.append("q", songSearchSpec.query);
			if (songSearchSpec.searchBy.length > 0) {
				params.append("by", songSearchSpec.searchBy.join(","));
			}
			router.push("/search?" + params);
		} catch (error) {
			console.error("Error searching song:", error);
			notification.error("Error searching song");
		}
	};

	return (
		<div className="search-bar-container">
			<SongSearchBar onEnterPressed={handleOnEnterPressed} placeholder="Search" />
		</div>
	);
};

export default SearchBar;
