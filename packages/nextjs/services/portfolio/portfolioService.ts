import { formatEther } from "viem";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";

export interface SongParticipation {
	id: string;
	songId: string;
	songTitle: string;
	artist: string;
	partsOwned: number;
	participationPercent: number;
	plays: number;
	playsInPeriod: number;
	periodDays: number;
	purchaseDate: string;
	tokensInvested: number;
	investedToken: string;
	partPrice: number;
	playFeeWave: number;
	imageUrl: string;
}

export interface PortfolioStats {
	totalTokensInvested: number;
	tokenSymbol: string;
	songsInvested: number;
	totalPartsOwned: number;
	totalPlays: number;
}

export type PortfolioPositionFromPonder = {
	songId: string;
	boughtParts: string;
	plays: number;
	playsInPeriod: number;
	periodDays: number;
	firstPurchaseTimestamp: number;
	lastPurchaseTimestamp: number;
};

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export async function fetchPortfolioPositionsFromPonder(
	address: string,
	days = 30
): Promise<PortfolioPositionFromPonder[]> {
	const response = await fetch(`${PONDER_URL}/portfolio/positions/${address}?days=${days}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch portfolio positions (HTTP ${response.status})`);
	}

	const data = await response.json();
	return data.items || [];
}

export function buildSongParticipations(
	positions: PortfolioPositionFromPonder[],
	songsMetadata: SongMetadata[]
): SongParticipation[] {
	const metadataBySongId = new Map(songsMetadata.map(song => [song.id.toString(), song]));

	return positions
		.map(position => {
			const metadata = metadataBySongId.get(position.songId);
			if (!metadata) {
				return null;
			}

			const partsOwned = Number(BigInt(position.boughtParts));
			const totalParts = Number(metadata.royaltiesDistribution.totalParts);
			const participationPercent = totalParts > 0 ? (partsOwned / totalParts) * 100 : 0;
			const partPrice = Number(formatEther(metadata.partPrice));
			const playFeeWave = Number(formatEther(metadata.playFee));
			const tokensInvested = partsOwned * partPrice;

			return {
				id: position.songId,
				songId: position.songId,
				songTitle: metadata.name,
				artist: metadata.album.artist,
				partsOwned,
				participationPercent,
				plays: position.plays,
				playsInPeriod: position.playsInPeriod,
				periodDays: position.periodDays,
				purchaseDate: new Date(position.firstPurchaseTimestamp * 1000).toLocaleDateString(),
				tokensInvested,
				investedToken: "WAVE",
				partPrice,
				playFeeWave,
				imageUrl: getFileUrl(metadata.album.imageCID)
			};
		})
		.filter((item): item is SongParticipation => item !== null)
		.sort((a, b) => b.tokensInvested - a.tokensInvested);
}

export function buildPortfolioStats(participations: SongParticipation[]): PortfolioStats {
	const totalTokensInvested = participations.reduce((sum, p) => sum + p.tokensInvested, 0);
	const totalPartsOwned = participations.reduce((sum, p) => sum + p.partsOwned, 0);
	const totalPlays = participations.reduce((sum, p) => sum + p.plays, 0);

	return {
		totalTokensInvested,
		tokenSymbol: "WAVE",
		songsInvested: participations.length,
		totalPartsOwned,
		totalPlays
	};
}
