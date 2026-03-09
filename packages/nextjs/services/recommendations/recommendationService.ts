const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || "http://localhost:8000";

export interface RecommendationResponse {
	song?: string;
	user?: string;
	recommendations: string[];
}

export async function getRecommendationsForSong(songId: string, topN: number = 5): Promise<string[]> {
	try {
		const response = await fetch(`${ML_SERVICE_URL}/recommend/song/${songId}?topn=${topN}`);
		if (!response.ok) {
			throw new Error(`Failed to get recommendations: ${response.statusText}`);
		}
		const data: RecommendationResponse = await response.json();
		return data.recommendations;
	} catch (error) {
		console.error("Error getting recommendations for song:", error);
		return [];
	}
}

export async function getRecommendationsForUser(userId: string, topN: number = 5): Promise<string[]> {
	try {
		const response = await fetch(`${ML_SERVICE_URL}/recommend/user/${userId}?topn=${topN}`);
		if (!response.ok) {
			throw new Error(`Failed to get recommendations: ${response.statusText}`);
		}
		const data: RecommendationResponse = await response.json();
		return data.recommendations;
	} catch (error) {
		console.error("Error getting recommendations for user:", error);
		return [];
	}
}
