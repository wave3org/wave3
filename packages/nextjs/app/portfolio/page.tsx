"use client";

import { useState } from "react";
import { PortfolioStats } from "./_components/PortfolioStats";
import { SongDetailModal } from "./_components/SongDetailModal";
import { SongParticipationTable } from "./_components/SongParticipationTable";
import type { NextPage } from "next";
import {
	SongParticipation,
	fetchPortfolioStats,
	fetchSongParticipations
} from "~~/services/portfolio/portfolioService";

const PortfolioPage: NextPage = () => {
	const [selectedParticipation, setSelectedParticipation] = useState<SongParticipation | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const portfolioStats = fetchPortfolioStats();
	const songParticipations = fetchSongParticipations();

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
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-4xl font-bold text-white mb-2">Mi Portfolio</h1>
				<p className="text-gray-400">Visualizá el rendimiento de tus regalías y participaciones musicales.</p>
			</div>

			{/* Stats Cards */}
			<PortfolioStats stats={portfolioStats} />

			{/* Participation Table */}
			<SongParticipationTable participations={songParticipations} onViewDetails={handleViewDetails} />

			{/* Detail Modal */}
			<SongDetailModal participation={selectedParticipation} isOpen={isModalOpen} onClose={handleCloseModal} />
		</div>
	);
};

export default PortfolioPage;
