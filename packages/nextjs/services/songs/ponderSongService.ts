export interface SongFromPonder {
	songId: string;
	name: string;
	audioCID: string;
	blockTimestamp: string;
	transactionHash: string;
}

export const fetchSongsFromPonder = async (searchQuery?: string): Promise<SongFromPonder[]> => {
	const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

	try {
		let query = `query { songss(orderBy: "blockTimestamp", orderDirection: "desc"`;
		if (searchQuery) {
			query += `, where: { name_contains: "${searchQuery.replace(/"/g, '\\"')}" }`;
		}
		query += `) { items { songId name audioCID blockTimestamp transactionHash } } }`;

		console.log("Ponder query:", query);

		const response = await fetch(`${PONDER_URL}/graphql`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query })
		});

		if (!response.ok) return [];

		const data = await response.json();

		if (data.errors) {
			console.error("Ponder errors:", data.errors);
			return [];
		}

		return data.data?.songss?.items || [];
	} catch (error) {
		console.error("Ponder fetch error:", error);
		return [];
	}
};
