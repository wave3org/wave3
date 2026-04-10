"use client";

import { useEffect, useMemo, useState } from "react";
import {
	PortfolioPositionFromPonder,
	SongParticipation,
	buildPortfolioStats,
	buildSongParticipations,
	fetchPortfolioPositionsFromPonder
} from "../../services/portfolio/portfolioService";
import { PortfolioStats } from "./_components/PortfolioStats";
import { SongDetailModal } from "./_components/SongDetailModal";
import { SongParticipationTable } from "./_components/SongParticipationTable";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth/notification";

const PortfolioPage: NextPage = () => {
	const { address } = useAccount();
	const [selectedParticipation, setSelectedParticipation] = useState<SongParticipation | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [songIds, setSongIds] = useState<bigint[]>([]);
	const [songParticipations, setSongParticipations] = useState<SongParticipation[]>([]);

	const { data: songMetadataResponse, isLoading: songMetadataLoading } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getSongs",
		args: [songIds]
	});

	useEffect(() => {
		let cancelled = false;

		const loadPortfolioPositions = async () => {
			if (!address) {
				setSongIds([]);
				setSongParticipations([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const positions = await fetchPortfolioPositionsFromPonder(address);
				const ids = positions
					.map((position: PortfolioPositionFromPonder) => {
						try {
							return BigInt(position.songId);
						} catch {
							return null;
						}
					})
					.filter((id: bigint | null): id is bigint => id !== null);

				if (!cancelled) {
					setSongIds(ids);
				}
			} catch (error) {
				console.error("Failed to fetch portfolio positions:", error);
				if (!cancelled) {
					notification.error("Failed to load portfolio data");
					setSongIds([]);
					setSongParticipations([]);
					setLoading(false);
				}
			}
		};

		void loadPortfolioPositions();

		return () => {
			cancelled = true;
		};
	}, [address]);

	useEffect(() => {
		if (songMetadataLoading) {
			return;
		}

		if (!songMetadataResponse || songIds.length === 0) {
			setSongParticipations([]);
			setLoading(false);
			return;
		}

		if (!address) {
			setSongParticipations([]);
			setLoading(false);
			return;
		}

		const hydratePortfolio = async () => {
			try {
				const positions = await fetchPortfolioPositionsFromPonder(address);
				const songsMetadata = [...(songMetadataResponse.songs || [])] as SongMetadata[];
				setSongParticipations(buildSongParticipations(positions, songsMetadata));
			} catch (error) {
				console.error("Failed to hydrate portfolio:", error);
				notification.error("Failed to hydrate portfolio data");
				setSongParticipations([]);
			} finally {
				setLoading(false);
			}
		};

		void hydratePortfolio();
	}, [address, songIds.length, songMetadataLoading, songMetadataResponse]);

	const portfolioStats = useMemo(() => buildPortfolioStats(songParticipations), [songParticipations]);

	const handleViewDetails = (participation: SongParticipation) => {
		setSelectedParticipation(participation);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedParticipation(null);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2">My Portfolio</h1>
				<p className="text-base-content/60">Track your royalty positions and song performance.</p>
			</div>

			{!address ? (
				<div className="rounded-lg border border-base-300 bg-base-100 p-6 text-base-content/70">
					Connect your wallet to view your royalty portfolio.
				</div>
			) : loading ? (
				<div className="py-12 text-center">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			) : (
				<>
					<PortfolioStats stats={portfolioStats} />
					<SongParticipationTable participations={songParticipations} onViewDetails={handleViewDetails} />
					<SongDetailModal participation={selectedParticipation} isOpen={isModalOpen} onClose={handleCloseModal} />
				</>
			)}
		</div>
	);
};

export default PortfolioPage;
