"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SongParticipation } from "../../../services/portfolio/portfolioService";
import { MonthlyEarningsChart } from "./MonthlyEarningsChart";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { BoostButton } from "~~/components/BoostButton";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface SongDetailModalProps {
	participation: SongParticipation | null;
	isOpen: boolean;
	onClose: () => void;
}

export const SongDetailModal = ({ participation, isOpen, onClose }: SongDetailModalProps) => {
	const { address } = useAccount();
	const [monthlyData, setMonthlyData] = useState<Record<string, string>>({});
	const songId = participation?.songId;
	const isArtistOwner =
		!!address && !!participation?.artistAddress && address.toLowerCase() === participation.artistAddress.toLowerCase();

	useEffect(() => {
		if (!isOpen || !songId || !address) return;
		setMonthlyData({});
		fetch(`/api/portfolio/${address}/${songId}/monthly`)
			.then(r => r.json())
			.then(setMonthlyData)
			.catch(() => {});
	}, [isOpen, songId, address]);

	const { writeContractAsync: writeWavecoin, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const { data: pendingRoyalties } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getPendingRoyalties",
		args: [participation ? BigInt(participation.songId) : 0n, address ?? "0x0000000000000000000000000000000000000000"]
	});

	const handleWithdrawRoyalties = async () => {
		if (!participation) return;
		try {
			await writeWavecoin({
				functionName: "withdrawRoyalties",
				args: [BigInt(participation.songId)]
			});
			notification.success("Royalties withdrawn successfully");
		} catch (error) {
			console.error("Error withdrawing royalties:", error);
			notification.error("Failed to withdraw royalties");
		}
	};

	if (!isOpen || !participation) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

			<div className="relative bg-base-100 rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col">
				<button
					onClick={onClose}
					className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors text-base-content"
				>
					x
				</button>

				<div className="flex flex-col md:flex-row overflow-y-auto">
					<div className="md:w-2/5 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-6 flex items-center justify-center">
						<div className="relative w-full aspect-square max-w-xs">
							{participation.imageUrl ? (
								<Image
									src={participation.imageUrl}
									alt={participation.songTitle}
									fill
									className="rounded-lg object-cover"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center rounded-lg bg-base-300 text-base-content/40 text-sm">
									No cover
								</div>
							)}
						</div>
					</div>

					<div className="md:w-3/5 p-6 bg-base-100">
						<h2 className="text-2xl font-bold mb-0.5 pr-8">{participation.songTitle}</h2>
						<p className="text-base text-base-content/60 mb-4">{participation.artist}</p>

						<div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
							<div>
								<div className="text-xs text-base-content/60">Purchase Date</div>
								<div className="text-sm font-medium">{participation.purchaseDate}</div>
							</div>
							<div>
								<div className="text-xs text-base-content/60">Part Price</div>
								<div className="text-sm font-medium">
									{participation.buyPrice.toFixed(2)} {participation.investedToken}
								</div>
							</div>
							<div>
								<div className="text-xs text-base-content/60">Parts Owned</div>
								<div className="text-sm font-medium">{participation.partsOwned}</div>
							</div>
							<div>
								<div className="text-xs text-base-content/60">Total Invested</div>
								<div className="text-sm font-medium">
									{participation.tokensInvested.toFixed(2)} {participation.investedToken}
								</div>
							</div>
							<div>
								<div className="text-xs text-base-content/60">My Participation</div>
								<div className="text-xl font-bold text-primary">{participation.participationPercent.toFixed(2)}%</div>
							</div>
							<div>
								<div className="text-xs text-base-content/60">Available to withdraw</div>
								<div className="text-xl font-bold text-success">
									{pendingRoyalties !== undefined ? formatEther(pendingRoyalties) : "-"} WAVE
								</div>
							</div>
							<div className="col-span-2">
								<div className="text-xs text-base-content/60 mb-1">Song Performance</div>
								<div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
									{participation.plays} plays registered
								</div>
							</div>
						</div>

						{Object.keys(monthlyData).length > 0 && (
							<div className="mb-4">
								<div className="text-xs text-base-content/60 mb-2">Earnings last 6 months (WAVE)</div>
								<MonthlyEarningsChart data={monthlyData} />
							</div>
						)}

						<div className="flex gap-3">
							<button className="btn btn-outline flex-1" disabled={isPending} onClick={handleWithdrawRoyalties}>
								{isPending ? <span className="loading loading-spinner loading-xs" /> : "Withdraw Royalties"}
							</button>
						</div>
						{isArtistOwner && (
							<div className="mt-3">
								<BoostButton songId={BigInt(participation.songId)} />
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
