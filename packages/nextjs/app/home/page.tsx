"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Carrousel from "./_components/Carrousel";
import Featured from "./_components/Featured";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { fetchFeatured, fetchNewReleases, fetchTrending } from "~~/services/recommendations/recommendationService";
import "~~/styles/home-page.css";
import { notification } from "~~/utils/scaffold-eth/notification";

const Home: NextPage = () => {
	const { address } = useAccount();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [featuredId, setFeaturedId] = useState<bigint>(0n);
	const [newReleasesIds, setNewReleasesIds] = useState<bigint[]>([]);
	const [treandingIds, setTreandingIds] = useState<bigint[]>([]);
	const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
	const [isLoadingNewReleases, setIsLoadingNewReleases] = useState(true);
	const [isLoadingTrending, setIsLoadingTrending] = useState(true);

	useEffect(() => {
		const fetchSongsIds = async () => {
			try {
				if (address) {
					setFeaturedId(await fetchFeatured(address));
					setIsLoadingFeatured(false);
					setNewReleasesIds(await fetchNewReleases());
					setIsLoadingNewReleases(false);
					setTreandingIds(await fetchTrending());
					setIsLoadingTrending(false);
				}
			} catch (error) {
				console.error("❌ Failed to fetch songs from recomendation service:", error);
				notification.error("Failed to fetch songs from recomendation service");
			}
		};
		fetchSongsIds();
	}, [address]);

	const handleClick = async () => {
		const searchUrl: string = "/search?q=" + searchQuery;
		try {
			router.push(searchUrl);
		} catch (error) {
			console.error("❌ Error searching song:", error);
			notification.error("Error searching song");
		}
	};

	// TODO: SEARCH BAR SHOULD BE A COMPONENT
	return (
		<>
			<div className="mb-8 px-4 pt-4">
				<input
					type="text"
					placeholder="Buscar canciones..."
					value={searchQuery}
					onChange={event => setSearchQuery(event.target.value)}
					className="input input-bordered w-full text-lg"
				/>
				<button className="btn btn-primary w-full mt-2" onClick={() => handleClick()}>
					<span>Buscar</span>
				</button>
			</div>
			{isLoadingFeatured ? <span className="loading loading-spinner"></span> : <Featured songId={featuredId} />}
			{isLoadingNewReleases ? (
				<span className="loading loading-spinner"></span>
			) : (
				<div className="carrousel-container">
					<Carrousel title="New Releases" songIds={newReleasesIds} />
				</div>
			)}
			{isLoadingTrending ? (
				<span className="loading loading-spinner"></span>
			) : (
				<div className="carrousel-container">
					<Carrousel title="Trending on wave3" songIds={treandingIds} />
				</div>
			)}
		</>
	);
};

export default Home;
