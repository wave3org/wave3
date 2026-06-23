import HomeClient from "./HomeClient";
import type { NextPage } from "next";
import { fetchNewlyReleasedSongs, fetchTrendingSongs } from "~~/services/songs/songService";
import "~~/styles/home-page.css";
import { serializeSong } from "~~/utils/songSerializer";

const Home: NextPage = async () => {
	const [newReleases, trending] = await Promise.all([
		fetchNewlyReleasedSongs().catch(() => null),
		fetchTrendingSongs().catch(() => null)
	]);

	return (
		<HomeClient
			initialNewReleases={newReleases ? newReleases.map(serializeSong) : null}
			initialTrending={trending ? trending.map(serializeSong) : null}
		/>
	);
};

export default Home;
