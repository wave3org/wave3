"use client";

import { useEffect, useState } from "react";
import Grid from "./_components/Grid";
import { useAccount } from "wagmi";
import { fetchSongsOwned } from "~~/services/search/searchServiceMock";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { notification } from "~~/utils/scaffold-eth";

export default function MarketplacePage() {
	const { address } = useAccount();
	const [songIds, setSongIds] = useState<bigint[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchSearchResults = async () => {
			try {
				if (address) {
					setSongIds(await fetchSongsOwned());
					setIsLoading(false);
				}
			} catch (error) {
				console.error("❌ Failed to fetch songs:", error);
				notification.error("Failed to fetch songs");
			}
		};

		fetchSearchResults();
	}, [address]);

	return (
		<>
			{isLoading ? (
				<span className="loading loading-spinner"></span>
			) : (
				<>
					<div>
						<span className="title">Song Marketplace</span>
					</div>
					<div>
						<span className="info">Invest in your favorite artists by acquiring a share of their royalties</span>
					</div>
					<Grid songIds={songIds} />
				</>
			)}
		</>
	);
}
