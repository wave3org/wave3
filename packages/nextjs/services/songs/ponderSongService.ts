import { GetSongsDocument, type GetSongsQuery, type GetSongsQueryVariables } from "../../src/generated/graphql";
import { GraphQLClient } from "graphql-request";

export type SongFromPonder = GetSongsQuery["songss"]["items"][number];

class PonderClient {
	private client: GraphQLClient;

	constructor() {
		const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
		this.client = new GraphQLClient(`${PONDER_URL}/graphql`);
	}

	async getSongs(searchQuery?: string): Promise<SongFromPonder[]> {
		try {
			const variables: GetSongsQueryVariables = searchQuery ? { nameContains: searchQuery } : {};

			const data = await this.client.request<GetSongsQuery, GetSongsQueryVariables>(GetSongsDocument, variables);
			return data.songss.items;
		} catch (error) {
			console.error("Ponder fetch error:", error);
			return [];
		}
	}
}

const ponderClient = new PonderClient();

export const fetchSongsFromPonder = async (searchQuery?: string): Promise<SongFromPonder[]> => {
	return ponderClient.getSongs(searchQuery);
};
