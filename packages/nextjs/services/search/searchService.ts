import { SongFromPonder, fetchMostPlayedSongsFromPonder, fetchSongsFromPonder } from "../songs/ponderSongService";
import { fetchSongs } from "../songs/songService";
import { SongMetadata } from "~~/types/songMetadata";

export async function searchSongs(query: string = ""): Promise<SongMetadata[] | null> {
	let items: SongFromPonder[];
	const songIds: bigint[] = [];

	if (query) {
		items = await fetchSongsFromPonder(query);
	} else {
		items = await fetchMostPlayedSongsFromPonder(18);
	}

	for (const item of items) {
		songIds.push(BigInt(item.songId));
	}

	return await fetchSongs(songIds);
}
