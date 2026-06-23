"use client";

import { useEffect, useState } from "react";
import Carrousel from "./_components/Carrousel";
import Featured from "./_components/Featured";
import SearchBar from "./_components/SearchBar";
import { useAccount } from "wagmi";
import { fetchFeaturedSong } from "~~/services/songs/songService";
import { SongMetadata } from "~~/types/songMetadata";
import { SerializedSongMetadata, deserializeSong } from "~~/utils/songSerializer";

interface HomeClientProps {
	initialNewReleases: SerializedSongMetadata[] | null;
	initialTrending: SerializedSongMetadata[] | null;
	initialFeatured: SerializedSongMetadata | null;
}

export default function HomeClient({ initialNewReleases, initialTrending, initialFeatured }: HomeClientProps) {
	const { address } = useAccount();
	const [featured, setFeatured] = useState<SongMetadata | null>(
		initialFeatured ? deserializeSong(initialFeatured) : null
	);

	const newReleases = initialNewReleases ? initialNewReleases.map(deserializeSong) : null;
	const trending = initialTrending ? initialTrending.map(deserializeSong) : null;

	useEffect(() => {
		if (!address) return;
		fetchFeaturedSong(address)
			.then(setFeatured)
			.catch(err => {
				console.error("Failed to fetch featured song:", err);
			});
	}, [address]);

	return (
		<>
			<SearchBar />
			<Featured songMetadata={featured} />
			<Carrousel title="New Releases" songsMetadata={newReleases} />
			<Carrousel title="Trending on wave3" songsMetadata={trending} />
		</>
	);
}
