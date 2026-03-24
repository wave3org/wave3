import { AlbumMetadata } from "./albumMetadata";
import { RoyaltiesMetadata } from "./royaltiesMetadata";

export type SongMetadata = {
	id: bigint;
	name: string;
	audioCID: string;
	playFee: bigint;
	partPrice: bigint;
	album: AlbumMetadata;
	royaltiesDistribution: RoyaltiesMetadata;
};
