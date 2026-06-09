export enum SearchBy {
	Song = "SONG",
	Album = "ALBUM",
	Artist = "ARTIST",
	Genre = "GENRE"
}

export type SongSearchSpec = {
	query: string;
	searchBy: SearchBy[];
};
