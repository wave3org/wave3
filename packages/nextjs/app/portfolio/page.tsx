"use client";

import { useEffect, useMemo, useState } from "react";
import {
	PortfolioPositionFromPonder,
	SongParticipation,
	buildPortfolioStats,
	buildSongParticipations,
	fetchPortfolioEarningsFromPonder,
	fetchPortfolioPositionsFromPonder
} from "../../services/portfolio/portfolioService";
import { PortfolioStats } from "./_components/PortfolioStats";
import { SongDetailModal } from "./_components/SongDetailModal";
import { SongParticipationTable } from "./_components/SongParticipationTable";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth/notification";

const PortfolioPage: NextPage = () => {
	const { address } = useAccount();
	const [selectedParticipation, setSelectedParticipation] = useState<SongParticipation | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [songIds, setSongIds] = useState<bigint[]>([]);
	const [songParticipations, setSongParticipations] = useState<SongParticipation[]>([]);
	const [reloadNonce, setReloadNonce] = useState(0);

	const { writeContractAsync: writeWavecoin, isPending: isWithdrawManyPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const { data: songMetadataResponse, isLoading: songMetadataLoading } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getSongs",
		args: [songIds]
	});

	const { data: pendingRoyaltiesMany } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getPendingRoyaltiesMany",
		args: [songIds, address ?? "0x0000000000000000000000000000000000000000"]
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
	}, [address, reloadNonce]);

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
				const earnings = await fetchPortfolioEarningsFromPonder(address);
				const earningsBySongId = new Map(earnings.items.map(e => [e.songId, e.earned]));
				setSongParticipations(buildSongParticipations(positions, songsMetadata, earningsBySongId));
			} catch (error) {
				console.error("Failed to hydrate portfolio:", error);
				notification.error("Failed to hydrate portfolio data");
				setSongParticipations([]);
			} finally {
				setLoading(false);
			}
		};

		void hydratePortfolio();
	}, [address, reloadNonce, songIds.length, songMetadataLoading, songMetadataResponse]);

	const portfolioStats = useMemo(() => buildPortfolioStats(songParticipations), [songParticipations]);
	const pendingRoyaltyAmounts = pendingRoyaltiesMany?.[0] ?? [];
	const withdrawManyTotal = pendingRoyaltiesMany?.[2] ?? 0n;
	const hasMultiplePendingSongs = pendingRoyaltyAmounts.filter((amount: bigint) => amount > 0n).length > 1;

	const handleViewDetails = (participation: SongParticipation) => {
		setSelectedParticipation(participation);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedParticipation(null);
	};

	const handleWithdrawMany = async () => {
		if (songIds.length === 0 || withdrawManyTotal === 0n) return;

		try {
			await writeWavecoin({
				functionName: "withdrawRoyaltiesMany",
				args: [songIds]
			});
			notification.success("Royalties withdrawn successfully");
			setReloadNonce(nonce => nonce + 1);
		} catch (error) {
			console.error("Error withdrawing royalties:", error);
			notification.error("Failed to withdraw royalties");
		}
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
					{hasMultiplePendingSongs && (
						<div className="mb-6 flex flex-col gap-3 rounded-lg border border-success/30 bg-base-100 p-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div className="text-xs text-base-content/60">Available across songs</div>
								<div className="text-xl font-bold text-success">
									{parseFloat(formatEther(withdrawManyTotal)).toFixed(4)} WAVE
								</div>
							</div>
							<button
								className="btn btn-success"
								disabled={isWithdrawManyPending || withdrawManyTotal === 0n}
								onClick={handleWithdrawMany}
							>
								{isWithdrawManyPending ? <span className="loading loading-spinner loading-xs" /> : null}
								Withdraw all royalties
							</button>
						</div>
					)}
					<SongParticipationTable participations={songParticipations} onViewDetails={handleViewDetails} />
					<SongDetailModal participation={selectedParticipation} isOpen={isModalOpen} onClose={handleCloseModal} />
				</>
			)}
		</div>
	);
};

export default PortfolioPage;
