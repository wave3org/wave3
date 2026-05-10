"use client";

import { useState } from "react";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface BoostButtonProps {
	songId: bigint;
}

export const BoostButton = ({ songId }: BoostButtonProps) => {
	const [boostedUntil, setBoostedUntil] = useState<Date | null>(null);
	const { writeContractAsync: writeWavecoin, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const handleBoost = async () => {
		try {
			await writeWavecoin({
				functionName: "boostSong",
				args: [songId]
			});
			const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
			setBoostedUntil(expiresAt);
			notification.success(`Boosted until ${expiresAt.toLocaleDateString()}`);
		} catch (error) {
			console.error("Error boosting song:", error);
			notification.error("Failed to boost song");
		}
	};

	if (boostedUntil) {
		return (
			<span className="text-sm text-success font-medium">Boosted until {boostedUntil.toLocaleDateString()} ✓</span>
		);
	}

	return (
		<button className="btn btn-sm btn-outline btn-warning" onClick={handleBoost} disabled={isPending}>
			{isPending ? <span className="loading loading-spinner loading-xs" /> : "⚡ Boost — 10 WAVE / month"}
		</button>
	);
};
