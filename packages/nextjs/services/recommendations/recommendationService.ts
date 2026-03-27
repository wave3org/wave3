const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || "http://localhost:8000";

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

export async function fetchFeaturedMock(): Promise<bigint> {
	return 5n;
}

export async function fetchNewReleasesMock(): Promise<bigint[]> {
	return [0n, 1n, 2n, 3n, 4n];
}

export async function fetchTrendingMock(): Promise<bigint[]> {
	return [1n, 2n, 3n, 4n, 5n];
}
