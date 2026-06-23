import HomeClient from "./HomeClient";
import type { NextPage } from "next";
import { fetchFeaturedSong, fetchNewlyReleasedSongs, fetchTrendingSongs } from "~~/services/songs/songService";
import "~~/styles/home-page.css";
import { serializeSong } from "~~/utils/songSerializer";

export const dynamic = "force-dynamic";

const Home: NextPage = async () => {
	const [newReleases, trending, globalFeatured] = await Promise.all([
		fetchNewlyReleasedSongs().catch(() => null),
		fetchTrendingSongs().catch(() => null),
		fetchFeaturedSong("").catch(() => null)
	]);

	return (
		<HomeClient
			initialNewReleases={newReleases ? newReleases.map(serializeSong) : null}
			initialTrending={trending ? trending.map(serializeSong) : null}
			initialFeatured={globalFeatured ? serializeSong(globalFeatured) : null}
		/>
	);
};

export default Home;
