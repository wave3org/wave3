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
	const [songIds, setSongIds] = useState<number[]>([]);
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
						<span className="title">Marketplace de Canciones</span>
					</div>
					<div>
						<span className="info">Invertí en tus artistas favoritos adquiriendo una parte de sus regalías</span>
					</div>
					<div>
						<span>Buscador y filtros</span>
					</div>
					<div className="marketplace-container">
						<Grid songIds={songIds} />
					</div>
				</>
			)}
		</>
	);
}
