"use client";

import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface BoostButtonProps {
	songId: bigint;
}

export const BoostButton = ({ songId }: BoostButtonProps) => {
	const { data: boostExpiry, refetch } = useScaffoldReadContract({
		contractName: "SongsModel",
		functionName: "boostExpiry",
		args: [songId]
	});

	const { writeContractAsync: writeWavecoin, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const now = BigInt(Math.floor(Date.now() / 1000));
	const isBoosted = boostExpiry !== undefined && boostExpiry > now;
	const boostedUntil = isBoosted ? new Date(Number(boostExpiry) * 1000) : null;

	const handleBoost = async () => {
		try {
			await writeWavecoin({
				functionName: "boostSong",
				args: [songId]
			});
			await refetch();
			notification.success("Song boosted!");
		} catch (error) {
			console.error("Error boosting song:", error);
			notification.error("Failed to boost song");
		}
	};

	if (boostedUntil) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-sm text-success font-medium">
					Boosted until {boostedUntil.toLocaleDateString("en-GB")} ✓
				</span>
				<button className="btn btn-xs btn-outline btn-warning" onClick={handleBoost} disabled={isPending}>
					{isPending ? <span className="loading loading-spinner loading-xs" /> : "⚡ Extend"}
				</button>
			</div>
		);
	}

	return (
		<button className="btn btn-sm btn-outline btn-warning" onClick={handleBoost} disabled={isPending}>
			{isPending ? <span className="loading loading-spinner loading-xs" /> : "⚡ Boost — 10 WAVE / month"}
		</button>
	);
};
