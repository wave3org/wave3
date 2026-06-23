"use client";

import { useEffect, useState } from "react";
import Carrousel from "./_components/Carrousel";
import Featured from "./_components/Featured";
import SearchBar from "./_components/SearchBar";
import { useAccount } from "wagmi";
import ComponentWithLoading from "~~/components/ComponentWithLoading";
import { fetchFeaturedSong } from "~~/services/songs/songService";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth/notification";
import { SerializedSongMetadata, deserializeSong } from "~~/utils/songSerializer";

interface HomeClientProps {
	initialNewReleases: SerializedSongMetadata[] | null;
	initialTrending: SerializedSongMetadata[] | null;
}

export default function HomeClient({ initialNewReleases, initialTrending }: HomeClientProps) {
	const { address } = useAccount();
	const [featured, setFeatured] = useState<SongMetadata | null>(null);
	const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

	const newReleases = initialNewReleases ? initialNewReleases.map(deserializeSong) : null;
	const trending = initialTrending ? initialTrending.map(deserializeSong) : null;

	useEffect(() => {
		if (!address) return;
		setIsLoadingFeatured(true);
		fetchFeaturedSong(address)
			.then(setFeatured)
			.catch(err => {
				console.error("Failed to fetch featured song:", err);
				notification.error("Failed to fetch featured song");
			})
			.finally(() => setIsLoadingFeatured(false));
	}, [address]);

	return (
		<>
			<SearchBar />
			<ComponentWithLoading isLoading={isLoadingFeatured}>
				<Featured songMetadata={featured} />
			</ComponentWithLoading>
			<Carrousel title="New Releases" songsMetadata={newReleases} />
			<Carrousel title="Trending on wave3" songsMetadata={trending} />
		</>
	);
}
