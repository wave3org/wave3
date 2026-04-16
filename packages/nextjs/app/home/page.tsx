"use client";

import { useEffect, useState } from "react";
import Carrousel from "./_components/Carrousel";
import Featured from "./_components/Featured";
import SearchBar from "./_components/SearchBar";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import ComponentWithLoading from "~~/components/ComponentWithLoading";
import { fetchFeaturedSong, fetchNewlyReleasedSongs, fetchTrendingSongs } from "~~/services/songs/songService";
import "~~/styles/home-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth/notification";

const Home: NextPage = () => {
	const { address } = useAccount();
	const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
	const [featured, setFeatured] = useState<SongMetadata | null>(null);
	const [isLoadingNewReleases, setIsLoadingNewReleases] = useState(true);
	const [newReleases, setNewReleases] = useState<SongMetadata[] | null>(null);
	const [isLoadingTrending, setIsLoadingTrending] = useState(true);
	const [treanding, setTreanding] = useState<SongMetadata[] | null>(null);

	useEffect(() => {
		const fetchSongsIds = async () => {
			try {
				if (address) {
					setFeatured(await fetchFeaturedSong(address));
					setIsLoadingFeatured(false);
					setNewReleases(await fetchNewlyReleasedSongs());
					setIsLoadingNewReleases(false);
					setTreanding(await fetchTrendingSongs());
					setIsLoadingTrending(false);
				}
			} catch (error) {
				console.error("Failed to fetch songs from recomendation service:", error);
				notification.error("Failed to fetch songs from recomendation service");
				setIsLoadingFeatured(false);
				setIsLoadingNewReleases(false);
				setIsLoadingTrending(false);
			}
		};
		fetchSongsIds();
	}, [address]);

	return (
		<>
			<SearchBar />
			<ComponentWithLoading isLoading={isLoadingFeatured}>
				<Featured songMetadata={featured} />
			</ComponentWithLoading>

			<ComponentWithLoading isLoading={isLoadingNewReleases}>
				<Carrousel title="New Releases" songsMetadata={newReleases} />
			</ComponentWithLoading>

			<ComponentWithLoading isLoading={isLoadingTrending}>
				<Carrousel title="Trending on wave3" songsMetadata={treanding} />
			</ComponentWithLoading>
		</>
	);
};

export default Home;
