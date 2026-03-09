"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getRecommendationsForSong,
	getRecommendationsForUser
} from "../../services/recommendations/recommendationService";
import { useAccount } from "wagmi";

export default function RecommendationsPage() {
	const { address } = useAccount();
	const [selectedSongId, setSelectedSongId] = useState<string>("");
	const [recommendationsSong, setRecommendationsSong] = useState<string[]>([]);
	const [recommendationsUser, setRecommendationsUser] = useState<string[]>([]);
	const [loadingSong, setLoadingSong] = useState(false);
	const [loadingUser, setLoadingUser] = useState(false);
	const [trainingLoading, setTrainingLoading] = useState(false);

	const handleRecommendByUser = useCallback(async () => {
		if (!address) return;
		setLoadingUser(true);
		try {
			const recs = await getRecommendationsForUser(address, 5);
			setRecommendationsUser(recs);
		} catch (error) {
			console.error(error);
		} finally {
			setLoadingUser(false);
		}
	}, [address]);

	useEffect(() => {
		handleRecommendByUser();
	}, [handleRecommendByUser]);

	const handleTrainModel = async () => {
		setTrainingLoading(true);
		try {
			const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || "http://localhost:8000";
			const response = await fetch(`${ML_SERVICE_URL}/train`, { method: "POST" });
			if (!response.ok) throw new Error(`Training failed`);
			await response.json();
			if (address) await handleRecommendByUser();
		} catch (error) {
			console.error(error);
		} finally {
			setTrainingLoading(false);
		}
	};

	const handleRecommendBySong = async () => {
		if (!selectedSongId) return;
		setLoadingSong(true);
		try {
			const recs = await getRecommendationsForSong(selectedSongId, 5);
			setRecommendationsSong(recs);
		} catch (error) {
			console.error(error);
		} finally {
			setLoadingSong(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-950 py-8 px-4">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-8 text-white">Recommendations</h1>

				{/* Train Button */}
				<div className="mb-8">
					<button
						onClick={handleTrainModel}
						disabled={trainingLoading}
						className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded"
					>
						{trainingLoading ? "Training..." : "Train Model"}
					</button>
				</div>

				{/* User Recommendations */}
				<div className="mb-12 border border-slate-700 p-6 rounded bg-slate-900">
					<h2 className="text-xl font-bold mb-4 text-white">Your Recommendations</h2>
					{address ? (
						<>
							<p className="text-sm text-slate-400 mb-4">Wallet: {address}</p>
							<button
								onClick={handleRecommendByUser}
								disabled={loadingUser}
								className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded mb-4"
							>
								{loadingUser ? "Loading..." : "Refresh"}
							</button>
							{recommendationsUser.length > 0 ? (
								<div className="space-y-2">
									{recommendationsUser.map((songId, idx) => (
										<div key={songId} className="bg-slate-800 p-2 rounded text-slate-100">
											{idx + 1}. {songId}
										</div>
									))}
								</div>
							) : (
								<p className="text-slate-400">No recommendations yet</p>
							)}
						</>
					) : (
						<p className="text-slate-400">Connect wallet to see recommendations</p>
					)}
				</div>

				{/* Song Recommendations */}
				<div className="border border-slate-700 p-6 rounded bg-slate-900">
					<h2 className="text-xl font-bold mb-4 text-white">Find Similar Songs</h2>
					<div className="mb-4">
						<label className="block text-sm font-bold mb-2 text-slate-300">Song ID:</label>
						<input
							type="text"
							value={selectedSongId}
							onChange={e => setSelectedSongId(e.target.value)}
							onKeyPress={e => e.key === "Enter" && handleRecommendBySong()}
							placeholder="Enter song ID"
							className="w-full border border-slate-700 p-2 rounded bg-slate-800 text-white placeholder-slate-500"
						/>
					</div>
					<button
						onClick={handleRecommendBySong}
						disabled={!selectedSongId || loadingSong}
						className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded mb-4"
					>
						{loadingSong ? "Loading..." : "Search"}
					</button>
					{recommendationsSong.length > 0 ? (
						<div className="space-y-2">
							{recommendationsSong.map((songId, idx) => (
								<div key={songId} className="bg-slate-800 p-2 rounded text-slate-100">
									{idx + 1}. {songId}
								</div>
							))}
						</div>
					) : selectedSongId && !loadingSong ? (
						<p className="text-slate-400">No recommendations found</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
