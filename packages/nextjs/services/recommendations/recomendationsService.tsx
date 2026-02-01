import { fetchSongMetadata, fetchSongsMetadata } from "../songs/songService";
import { SongMetadata } from "~~/types/songMetadata";

export const fetchFeatured = (): SongMetadata | null => {
	return fetchSongMetadata("0f4a852d-d14c-40b1-aa40-39fc6b790bb5");
};

export const fetchNewReleases = (): SongMetadata[] => {
	return fetchSongsMetadata();
};

export const fetchTrending = (): SongMetadata[] => {
	return fetchSongsMetadata();
};
