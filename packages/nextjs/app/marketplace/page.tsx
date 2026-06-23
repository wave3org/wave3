import MarketplaceClient from "./MarketplaceClient";
import { NextPage } from "next";
import { searchSongs } from "~~/services/search/searchService";
import { fetchSongPlaysStats } from "~~/services/songs/ponderSongService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { serializeSong } from "~~/utils/songSerializer";

export const dynamic = "force-dynamic";

const MarketplacePage: NextPage = async () => {
	const [songs, playsMap] = await Promise.all([
		searchSongs({ query: "", searchBy: [] }).catch(() => null),
		fetchSongPlaysStats(30).catch(() => new Map<string, number>())
	]);

	const initialSongs = songs ? songs.map(serializeSong) : null;
	const initialPlays30d = Object.fromEntries(playsMap);

	return (
		<>
			<div className="title-container">
				<span className="title">Song Marketplace</span>
				<span className="info">Discover songs and buy royalty shares from your favorite artists.</span>
			</div>

			<MarketplaceClient initialSongs={initialSongs} initialPlays30d={initialPlays30d} />
		</>
	);
};

export default MarketplacePage;
