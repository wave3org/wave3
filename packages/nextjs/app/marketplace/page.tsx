"use client";

import { useEffect, useState } from "react";
import Grid from "./_components/Grid";
import { SongSearchInput } from "~~/components/SongSearchInput";
import { fetchMostPlayedSongsFromPonder, fetchSongsFromPonder } from "~~/services/songs/ponderSongService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { notification } from "~~/utils/scaffold-eth";

export default function MarketplacePage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [songIds, setSongIds] = useState<bigint[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const fetchSongsForMarketplace = async () => {
			setIsLoading(true);
			try {
				let items = searchQuery ? await fetchSongsFromPonder(searchQuery) : await fetchMostPlayedSongsFromPonder(18);

				if (!searchQuery && items.length === 0) {
					items = await fetchSongsFromPonder();
				}

				const ids = items
					.map(item => {
						try {
							return BigInt(item.songId);
						} catch {
							return null;
						}
					})
					.filter((id): id is bigint => id !== null);

				if (!cancelled) {
					setSongIds(ids);
				}
			} catch (error) {
				console.error("❌ Failed to fetch songs:", error);
				if (!cancelled) {
					notification.error("Failed to fetch songs");
					setSongIds([]);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		const debounceTimer = setTimeout(() => {
			void fetchSongsForMarketplace();
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(debounceTimer);
		};
	}, [searchQuery]);

	return (
		<div className="container mx-auto px-4 py-8">
			{isLoading ? (
				<div className="py-12 text-center">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : (
				<div>
					<div className="mb-8">
						<h1 className="title">Song Marketplace</h1>
						<p className="info">Discover songs and buy royalty shares from your favorite artists.</p>
					</div>

					<SongSearchInput
						className="mb-6"
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Search songs to buy royalties..."
					/>

					{songIds.length === 0 ? (
						<div className="py-12 text-center text-base-content/60">
							{searchQuery ? "No songs found for this search" : "No songs with plays yet"}
						</div>
					) : (
						<Grid songIds={songIds} />
					)}
				</div>
			)}
		</div>
	);
}
