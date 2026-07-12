import { SongFromPonder, fetchMostPlayedSongsFromPonder, fetchSongsFromPonder } from "../songs/ponderSongService";
import { fetchSongs } from "../songs/songService";
import { SongMetadata } from "~~/types/songMetadata";
import { SongSearchSpec } from "~~/types/songSearchSpec";

export async function searchSongs(songSearchSpec: SongSearchSpec): Promise<SongMetadata[] | null> {
	let items: SongFromPonder[];
	const songIds: bigint[] = [];

	if (songSearchSpec.query) {
		items = await fetchSongsFromPonder(songSearchSpec);
	} else {
		items = await fetchMostPlayedSongsFromPonder(24);
	}

	for (const item of items) {
		songIds.push(BigInt(item.songId));
	}

	return await fetchSongs(songIds);
}
