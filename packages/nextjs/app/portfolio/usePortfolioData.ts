import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import {
	EarningsBySongFromPonder,
	EarningsSummaryFromPonder,
	PortfolioPositionFromPonder,
	PortfolioStats,
	SongParticipation,
	buildPortfolioStats,
	buildSongParticipations
} from "~~/services/portfolio/portfolioService";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth/notification";

export function usePortfolioData(): {
	address: string | undefined;
	loading: boolean;
	songParticipations: SongParticipation[];
	portfolioStats: PortfolioStats;
	hasMultiplePendingSongs: boolean;
	withdrawManyTotal: bigint;
	isWithdrawManyPending: boolean;
	handleWithdrawMany: () => Promise<void>;
} {
	const { address } = useAccount();
	const [loading, setLoading] = useState(true);
	const [songIds, setSongIds] = useState<bigint[]>([]);
	const [songParticipations, setSongParticipations] = useState<SongParticipation[]>([]);
	const [reloadNonce, setReloadNonce] = useState(0);
	const [cachedPositions, setCachedPositions] = useState<PortfolioPositionFromPonder[]>([]);
	const [cachedEarnings, setCachedEarnings] = useState<EarningsSummaryFromPonder | null>(null);

	const { writeContractAsync: writeWavecoin, isPending: isWithdrawManyPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const { data: songMetadataResponse, isLoading: songMetadataLoading } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getSongs",
		args: [songIds]
	});

	const { data: pendingRoyaltiesMany } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getPendingRoyaltiesMany",
		args: [songIds, address ?? "0x0000000000000000000000000000000000000000"]
	});

	useEffect(() => {
		let cancelled = false;

		const loadPortfolioData = async () => {
			if (!address) {
				setSongIds([]);
				setSongParticipations([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const res = await fetch(`/api/portfolio/${address}?days=30`);
				if (!res.ok) throw new Error("Failed to fetch portfolio");
				const { positions, earnings } = await res.json();

				const ids = (positions.items as PortfolioPositionFromPonder[])
					.map(p => {
						try {
							return BigInt(p.songId);
						} catch {
							return null;
						}
					})
					.filter((id): id is bigint => id !== null);

				if (!cancelled) {
					setCachedPositions(positions.items);
					setCachedEarnings(earnings);
					setSongIds(ids);
				}
			} catch (error) {
				console.error("Failed to fetch portfolio data:", error);
				if (!cancelled) {
					notification.error("Failed to load portfolio data");
					setSongIds([]);
					setSongParticipations([]);
					setLoading(false);
				}
			}
		};

		void loadPortfolioData();
		return () => {
			cancelled = true;
		};
	}, [address, reloadNonce]);

	useEffect(() => {
		if (songMetadataLoading) return;

		if (!songMetadataResponse || songIds.length === 0 || !address) {
			setSongParticipations([]);
			setLoading(false);
			return;
		}

		const hydratePortfolio = async () => {
			try {
				const songsMetadata = [...(songMetadataResponse.songs || [])] as SongMetadata[];
				const earningsBySongId = new Map(
					(cachedEarnings?.items ?? []).map((e: EarningsBySongFromPonder) => [e.songId, e.earned])
				);
				setSongParticipations(buildSongParticipations(cachedPositions, songsMetadata, earningsBySongId));
			} catch (error) {
				console.error("Failed to hydrate portfolio:", error);
				notification.error("Failed to hydrate portfolio data");
				setSongParticipations([]);
			} finally {
				setLoading(false);
			}
		};

		void hydratePortfolio();
	}, [address, reloadNonce, songIds.length, songMetadataLoading, songMetadataResponse]);

	const portfolioStats = useMemo(() => buildPortfolioStats(songParticipations), [songParticipations]);
	const pendingRoyaltyAmounts = pendingRoyaltiesMany?.[0] ?? [];
	const withdrawManyTotal = pendingRoyaltiesMany?.[2] ?? 0n;
	const hasMultiplePendingSongs = pendingRoyaltyAmounts.filter((amount: bigint) => amount > 0n).length > 1;

	const reload = () => setReloadNonce(n => n + 1);

	const handleWithdrawMany = async () => {
		if (songIds.length === 0 || withdrawManyTotal === 0n) return;
		try {
			await writeWavecoin({ functionName: "withdrawRoyaltiesMany", args: [songIds] });
			notification.success("Royalties withdrawn successfully");
			reload();
		} catch (error) {
			console.error("Error withdrawing royalties:", error);
			notification.error("Failed to withdraw royalties");
		}
	};

	return {
		address,
		loading,
		songParticipations,
		portfolioStats,
		hasMultiplePendingSongs,
		withdrawManyTotal,
		isWithdrawManyPending,
		handleWithdrawMany
	};
}
