"use client";

import { useState } from "react";
import {
	getRecommendationsForSong,
	getRecommendationsForUser
} from "../../services/recommendations/recommendationService";

export default function RecommendationsPage() {
	const [selectedSongId, setSelectedSongId] = useState<string>("");
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [recommendationsSong, setRecommendationsSong] = useState<string[]>([]);
	const [recommendationsUser, setRecommendationsUser] = useState<string[]>([]);
	const [loadingSong, setLoadingSong] = useState(false);
	const [loadingUser, setLoadingUser] = useState(false);

	const handleRecommendBySong = async () => {
		if (selectedSongId) {
			setLoadingSong(true);
			const recs = await getRecommendationsForSong(selectedSongId, 5);
			setRecommendationsSong(recs);
			setLoadingSong(false);
		}
	};

	const handleRecommendByUser = async () => {
		if (selectedUserId) {
			setLoadingUser(true);
			const recs = await getRecommendationsForUser(selectedUserId, 5);
			setRecommendationsUser(recs);
			setLoadingUser(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
			<div className="max-w-3xl mx-auto">
				<h1 className="text-4xl font-bold mb-12 text-white">🎵 Recommendation Tester</h1>

				{/* Song Recommendations Section */}
				<div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6">
					<h2 className="text-lg font-semibold mb-4 text-slate-100">Recommendations by Song</h2>

					<div className="mb-4">
						<label className="block text-sm font-medium text-slate-300 mb-2">Enter Song ID</label>
						<input
							type="text"
							value={selectedSongId}
							onChange={e => setSelectedSongId(e.target.value)}
							placeholder="e.g., song-1"
							className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
						/>
					</div>

					<button
						onClick={handleRecommendBySong}
						disabled={!selectedSongId || loadingSong}
						className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition"
					>
						{loadingSong ? "Loading..." : "🎯 Get Similar Songs"}
					</button>

					{recommendationsSong.length > 0 && (
						<div className="mt-6 p-4 bg-slate-900/30 border border-green-600/50 rounded-lg">
							<h3 className="text-base font-semibold mb-3 text-slate-100">
								Similar to <span className="text-green-400">{selectedSongId}</span>
							</h3>
							<ol className="space-y-2">
								{recommendationsSong.map((songId, idx) => (
									<li key={songId} className="flex items-center text-slate-300">
										<span className="text-blue-400 font-bold mr-3">#{idx + 1}</span>
										{songId}
									</li>
								))}
							</ol>
						</div>
					)}
				</div>

				{/* User Recommendations Section */}
				<div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
					<h2 className="text-lg font-semibold mb-4 text-slate-100">Recommendations for User</h2>

					<div className="mb-4">
						<label className="block text-sm font-medium text-slate-300 mb-2">Enter User Address</label>
						<input
							type="text"
							value={selectedUserId}
							onChange={e => setSelectedUserId(e.target.value)}
							placeholder="e.g., 0x1234... or user_address"
							className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
						/>
					</div>

					<button
						onClick={handleRecommendByUser}
						disabled={!selectedUserId || loadingUser}
						className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition"
					>
						{loadingUser ? "Loading..." : "🎯 Get User Recommendations"}
					</button>

					{recommendationsUser.length > 0 && (
						<div className="mt-6 p-4 bg-slate-900/30 border border-purple-600/50 rounded-lg">
							<h3 className="text-base font-semibold mb-3 text-slate-100">
								Recommended for <span className="text-purple-400">{selectedUserId}</span>
							</h3>
							<ol className="space-y-2">
								{recommendationsUser.map((songId, idx) => (
									<li key={songId} className="flex items-center text-slate-300">
										<span className="text-purple-400 font-bold mr-3">#{idx + 1}</span>
										{songId}
									</li>
								))}
							</ol>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
