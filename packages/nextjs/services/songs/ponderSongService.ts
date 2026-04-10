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

export type MostPlayedSongFromPonder = SongFromPonder & {
	plays: number;
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

	async getSong(songId: string): Promise<SongFromPonder | null> {
		const response = await fetch(`${this.baseUrl}/songs/${songId}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch song from database (HTTP ${response.status})`);
		}
		const data = await response.json();
		return data.item || null;
	}

	async getMostPlayedSongs(limit = 12): Promise<MostPlayedSongFromPonder[]> {
		const params = new URLSearchParams();
		params.append("limit", String(limit));

		const response = await fetch(`${this.baseUrl}/marketplace/most-played-songs?${params}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch most played songs from database (HTTP ${response.status})`);
		}

		const data = await response.json();
		return data.items || [];
	}
}

const ponderClient = new PonderClient();

export const fetchSongsFromPonder = async (searchQuery?: string): Promise<SongFromPonder[]> => {
	return ponderClient.getSongs(searchQuery);
};

export const fetchSongFromPonder = async (songId: string): Promise<SongFromPonder | null> => {
	return ponderClient.getSong(songId);
};

export const fetchMostPlayedSongsFromPonder = async (limit = 12): Promise<MostPlayedSongFromPonder[]> => {
	return ponderClient.getMostPlayedSongs(limit);
};
