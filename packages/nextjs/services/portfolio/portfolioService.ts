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
	buyPrice: number;
	sellPrice: number;
	playFeeWave: number;
	imageUrl: string;
	earnedInPeriod: string; // wei as string
}

export type EarningsBySongFromPonder = {
	songId: string;
	earned: string; // wei as string
};

export type EarningsSummaryFromPonder = {
	periodDays: number;
	items: EarningsBySongFromPonder[];
	totalEarned: string; // wei as string
};

export interface PortfolioStats {
	totalTokensInvested: number;
	tokenSymbol: string;
	songsInvested: number;
	totalPartsOwned: number;
	totalPlays: number;
	totalEarnedInPeriod: bigint;
	periodDays: number;
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

export async function fetchPortfolioEarningsFromPonder(address: string, days = 30): Promise<EarningsSummaryFromPonder> {
	const response = await fetch(`${PONDER_URL}/portfolio/earnings/${address}?days=${days}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch portfolio earnings (HTTP ${response.status})`);
	}

	const data = await response.json();
	return {
		periodDays: data.periodDays ?? days,
		items: data.items ?? [],
		totalEarned: data.totalEarned ?? "0"
	};
}

export function buildSongParticipations(
	positions: PortfolioPositionFromPonder[],
	songsMetadata: SongMetadata[],
	earningsBySongId: Map<string, string> = new Map()
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
			const buyPrice = Number(formatEther(metadata.buyPrice));
			const sellPrice = Number(formatEther(metadata.sellPrice));
			const playFeeWave = Number(formatEther(metadata.playFee));
			const tokensInvested = partsOwned * buyPrice;

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
				buyPrice,
				sellPrice,
				playFeeWave,
				imageUrl: getFileUrl(metadata.album.imageCID),
				earnedInPeriod: earningsBySongId.get(position.songId) ?? "0"
			};
		})
		.filter((item): item is SongParticipation => item !== null)
		.sort((a, b) => b.tokensInvested - a.tokensInvested);
}

export function buildPortfolioStats(participations: SongParticipation[]): PortfolioStats {
	const totalTokensInvested = participations.reduce((sum, p) => sum + p.tokensInvested, 0);
	const totalPartsOwned = participations.reduce((sum, p) => sum + p.partsOwned, 0);
	const totalPlays = participations.reduce((sum, p) => sum + p.plays, 0);
	const totalEarnedInPeriod = participations.reduce((sum, p) => sum + BigInt(p.earnedInPeriod), 0n);
	const periodDays = participations[0]?.periodDays ?? 30;

	return {
		totalTokensInvested,
		tokenSymbol: "WAVE",
		songsInvested: participations.length,
		totalPartsOwned,
		totalPlays,
		totalEarnedInPeriod,
		periodDays
	};
}
