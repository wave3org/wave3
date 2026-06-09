import { AlbumMetadata } from "./albumMetadata";
import { RoyaltiesMetadata } from "./royaltiesMetadata";

export type SongMetadata = {
	id: bigint;
	name: string;
	audioCID: string;
	playFee: bigint;
	buyPrice: bigint;
	album: AlbumMetadata;
	royaltiesDistribution: RoyaltiesMetadata;
};
