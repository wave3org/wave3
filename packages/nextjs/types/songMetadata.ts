import { ImageMetadata } from "./imageMetadata";

export type SongMetadata = {
	id: string;
	image: ImageMetadata;
	cid: string;
	title: string;
	artist: string;
	price: number;
	shares: number;
	availableShares: number;
};
