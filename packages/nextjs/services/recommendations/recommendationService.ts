const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_URL || "http://localhost:8000";
const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export interface RecommendationResponse {
	song?: string;
	user?: string;
	recommendations: string[];
}

/**
 * Get song recommendations similar to a given song.
 * @param songId - the song to find neighbors for.
 * @param topN - how many recommendations (default 5).
 * @returns list of song IDs.
 */
export async function getRecommendationsForSong(songId: string, topN: number = 5): Promise<string[]> {
	const response = await fetch(`${ML_SERVICE_URL}/recommend/song/${songId}?topn=${topN}`);
	if (!response.ok) {
		throw new Error(`Failed to get recommendations: ${response.statusText}`);
	}
	const data: RecommendationResponse = await response.json();
	return data.recommendations;
}

/**
 * Get personalized song recommendations for a user.
 * @param userId - wallet address.
 * @param topN - how many recommendations (default 5).
 * @returns list of song IDs.
 */
export async function getRecommendationsForUser(userId: string, topN: number = 5): Promise<string[]> {
	const response = await fetch(`${ML_SERVICE_URL}/recommend/user/${userId}?topn=${topN}`);
	if (!response.ok) {
		throw new Error(`Failed to get recommendations: ${response.statusText}`);
	}
	const data: RecommendationResponse = await response.json();
	return data.recommendations;
}

/**
 * Get a featured song for the home page.
 * Tries the ML recommender for the connected user first.
 * Falls back to the latest song added if ML is unavailable or user has no history.
 * @param userAddress - wallet address (optional).
 * @returns song ID, or 0n if no songs exist.
 */
export async function fetchFeatured(userAddress?: string): Promise<bigint> {
	// Try ML recommendation for this user first
	if (userAddress) {
		try {
			const res = await fetch(`${ML_SERVICE_URL}/recommend/user/${userAddress}?topn=1`);
			if (res.ok) {
				const data: RecommendationResponse = await res.json();
				if (data.recommendations.length > 0) {
					console.log(`[featured] ML recommendation for ${userAddress}: songId=${data.recommendations[0]}`);
					return BigInt(data.recommendations[0]);
				}
				console.log(`[featured] ML returned empty recommendations for ${userAddress}`);
			} else {
				console.log(`[featured] ML failed: ${res.status} ${res.statusText}`);
			}
		} catch (e) {
			console.log(`[featured] ML service unreachable: ${e}`);
		}
	}

	// Fallback: top songs by play count (newest if no plays yet)
	console.log("[featured] falling back to top songs from Ponder");
	const res = await fetch(`${PONDER_URL}/songs/top?limit=1`);
	if (!res.ok) throw new Error("Failed to fetch featured");
	const data = await res.json();
	if (!data.items?.length) return 0n;
	return BigInt(data.items[0].songId);
}

/**
 * Get the 5 most recently added songs.
 * @returns list of song IDs, newest first.
 */
export async function fetchNewReleases(): Promise<bigint[]> {
	const res = await fetch(`${PONDER_URL}/songs-with-albums?limit=5`);
	if (!res.ok) throw new Error("Failed to fetch new releases");
	const data = await res.json();
	return (data.items || []).map((s: { songId: string }) => BigInt(s.songId));
}

/**
 * Get the 5 most played songs (falls back to newest if no plays yet).
 * @returns list of song IDs, most played first.
 */
export async function fetchTrending(): Promise<bigint[]> {
	const res = await fetch(`${PONDER_URL}/songs/top?limit=5`);
	if (!res.ok) throw new Error("Failed to fetch trending");
	const data = await res.json();
	return (data.items || []).map((s: { songId: string }) => BigInt(s.songId));
}
