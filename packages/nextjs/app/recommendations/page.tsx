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
			const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_URL || "http://localhost:8000";
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
		<div className="py-8 px-4">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-8 text-base-content">Recomendaciones</h1>

				{/* Train Button */}
				<div className="mb-8">
					<button onClick={handleTrainModel} disabled={trainingLoading} className="btn btn-primary">
						{trainingLoading ? <span className="loading loading-spinner loading-sm"></span> : "Entrenar Modelo"}
					</button>
				</div>

				{/* User Recommendations */}
				<div className="mb-12 border border-base-300 p-6 rounded-lg bg-base-200">
					<h2 className="text-xl font-bold mb-4 text-base-content">Tus Recomendaciones</h2>
					{address ? (
						<>
							<p className="text-sm text-base-content/60 mb-4">Wallet: {address}</p>
							<button onClick={handleRecommendByUser} disabled={loadingUser} className="btn btn-primary btn-sm mb-4">
								{loadingUser ? <span className="loading loading-spinner loading-sm"></span> : "Refrescar"}
							</button>
							{recommendationsUser.length > 0 ? (
								<div className="space-y-2">
									{recommendationsUser.map((songId, idx) => (
										<div key={songId} className="bg-base-300 p-2 rounded text-base-content">
											{idx + 1}. {songId}
										</div>
									))}
								</div>
							) : (
								<p className="text-base-content/60">Sin recomendaciones aún</p>
							)}
						</>
					) : (
						<p className="text-base-content/60">Conectá tu wallet para ver recomendaciones</p>
					)}
				</div>

				{/* Song Recommendations */}
				<div className="border border-base-300 p-6 rounded-lg bg-base-200">
					<h2 className="text-xl font-bold mb-4 text-base-content">Buscar Canciones Similares</h2>
					<div className="mb-4">
						<label className="block text-sm font-bold mb-2 text-base-content/70">Song ID:</label>
						<input
							type="text"
							value={selectedSongId}
							onChange={e => setSelectedSongId(e.target.value)}
							onKeyPress={e => e.key === "Enter" && handleRecommendBySong()}
							placeholder="Ingresá un song ID"
							className="input input-bordered w-full"
						/>
					</div>
					<button
						onClick={handleRecommendBySong}
						disabled={!selectedSongId || loadingSong}
						className="btn btn-primary btn-sm mb-4"
					>
						{loadingSong ? <span className="loading loading-spinner loading-sm"></span> : "Buscar"}
					</button>
					{recommendationsSong.length > 0 ? (
						<div className="space-y-2">
							{recommendationsSong.map((songId, idx) => (
								<div key={songId} className="bg-base-300 p-2 rounded text-base-content">
									{idx + 1}. {songId}
								</div>
							))}
						</div>
					) : selectedSongId && !loadingSong ? (
						<p className="text-base-content/60">No se encontraron recomendaciones</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
