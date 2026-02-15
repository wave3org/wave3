export type SongFromPonder = {
	songId: string;
	name: string;
	audioCID: string;
	album: {
		name: string;
		artist: string;
		imageCID: string;
	} | null;
};

class PonderClient {
	private baseUrl: string;

	constructor() {
		this.baseUrl = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
	}

	async getSongs(searchQuery?: string): Promise<SongFromPonder[]> {
		const params = new URLSearchParams();
		if (searchQuery) params.append("name", searchQuery);
		params.append("limit", "100");

		const response = await fetch(`${this.baseUrl}/songs-with-albums?${params}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch songs from database (HTTP ${response.status})`);
		}
		const data = await response.json();
		return data.items || [];
	}
}

const ponderClient = new PonderClient();

export const fetchSongsFromPonder = async (searchQuery?: string): Promise<SongFromPonder[]> => {
	return ponderClient.getSongs(searchQuery);
};
