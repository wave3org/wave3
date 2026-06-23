import { SongMetadata } from "~~/types/songMetadata";

export type SerializedSongMetadata = {
	id: string;
	name: string;
	audioCID: string;
	playFee: string;
	buyPrice: string;
	album: {
		id: string;
		name: string;
		artist: string;
		imageCID: string;
	};
	royaltiesDistribution: {
		buyPrice: string;
		totalParts: string;
		availableParts: string;
	};
};

export function serializeSong(song: SongMetadata): SerializedSongMetadata {
	return {
		...song,
		id: song.id.toString(),
		playFee: song.playFee.toString(),
		buyPrice: song.buyPrice.toString(),
		album: { ...song.album, id: song.album.id.toString() },
		royaltiesDistribution: {
			buyPrice: song.royaltiesDistribution.buyPrice.toString(),
			totalParts: song.royaltiesDistribution.totalParts.toString(),
			availableParts: song.royaltiesDistribution.availableParts.toString()
		}
	};
}

export function deserializeSong(s: SerializedSongMetadata): SongMetadata {
	return {
		...s,
		id: BigInt(s.id),
		playFee: BigInt(s.playFee),
		buyPrice: BigInt(s.buyPrice),
		album: { ...s.album, id: BigInt(s.album.id) },
		royaltiesDistribution: {
			buyPrice: BigInt(s.royaltiesDistribution.buyPrice),
			totalParts: BigInt(s.royaltiesDistribution.totalParts),
			availableParts: BigInt(s.royaltiesDistribution.availableParts)
		}
	};
}
