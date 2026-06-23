"use client";

import { useState } from "react";
import { PortfolioStats } from "./_components/PortfolioStats";
import { SongDetailModal } from "./_components/SongDetailModal";
import { SongParticipationTable } from "./_components/SongParticipationTable";
import { usePortfolioData } from "./usePortfolioData";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { SongParticipation } from "~~/services/portfolio/portfolioService";

const PortfolioPage: NextPage = () => {
	const {
		address,
		loading,
		songParticipations,
		portfolioStats,
		hasMultiplePendingSongs,
		withdrawManyTotal,
		isWithdrawManyPending,
		handleWithdrawMany
	} = usePortfolioData();

	const [selectedParticipation, setSelectedParticipation] = useState<SongParticipation | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

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
