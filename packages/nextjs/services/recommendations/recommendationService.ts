const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || "http://localhost:8000";
const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export interface RecommendationResponse {
	song?: string;
	user?: string;
	recommendations: string[];
}

export async function getRecommendationsForSong(songId: string, topN: number = 5): Promise<string[]> {
	const response = await fetch(`${ML_SERVICE_URL}/recommend/song/${songId}?topn=${topN}`);
	if (!response.ok) {
		throw new Error(`Failed to get recommendations: ${response.statusText}`);
	}
	const data: RecommendationResponse = await response.json();
	return data.recommendations;
}

export async function getRecommendationsForUser(userId: string, topN: number = 5): Promise<string[]> {
	const response = await fetch(`${ML_SERVICE_URL}/recommend/user/${userId}?topn=${topN}`);
	if (!response.ok) {
		throw new Error(`Failed to get recommendations: ${response.statusText}`);
	}
	const data: RecommendationResponse = await response.json();
	return data.recommendations;
}

export async function fetchFeatured(): Promise<bigint> {
	const res = await fetch(`${PONDER_URL}/songs-with-albums?limit=1`);
	if (!res.ok) throw new Error("Failed to fetch featured");
	const data = await res.json();
	if (!data.items?.length) return 0n;
	return BigInt(data.items[0].songId);
}

export async function fetchNewReleases(): Promise<bigint[]> {
	const res = await fetch(`${PONDER_URL}/songs-with-albums?limit=5`);
	if (!res.ok) throw new Error("Failed to fetch new releases");
	const data = await res.json();
	return (data.items || []).map((s: { songId: string }) => BigInt(s.songId));
}

export async function fetchTrending(): Promise<bigint[]> {
	const res = await fetch(`${PONDER_URL}/trending?limit=5`);
	if (!res.ok) throw new Error("Failed to fetch trending");
	const data = await res.json();
	return (data.items || []).map((s: { songId: string }) => BigInt(s.songId));
}
