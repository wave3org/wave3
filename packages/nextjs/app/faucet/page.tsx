"use client";

import { formatUnits, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth/notification";

const FaucetPage = () => {
	const { address, isConnected } = useAccount();
	const { writeContractAsync: writeWavecoinAsync, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});
	const { data: balance } = useScaffoldReadContract({
		contractName: "Wavecoin",
		functionName: "balanceOf",
		args: [address],
		query: { enabled: Boolean(address) }
	});

	const handleMint = async () => {
		try {
			await writeWavecoinAsync({
				functionName: "mint",
				args: [parseEther("100")]
			});
		} catch (error) {
			console.error("❌ Error minting Wavecoin:", error);
			notification.error("Failed to mint WAVE tokens");
		}
	};

	return (
		<main className="flex min-h-screen items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<p className="text-center max-w-md">Get Wavecoin to access features and transactions in the music app.</p>
				<div className="text-center">
					<span>Your balance: </span>
					<strong>{balance ? `${formatUnits(balance, 18)} WAVE` : "-"}</strong>
				</div>
				<button className="btn btn-primary" onClick={handleMint} disabled={isPending || !isConnected}>
					{isPending ? "Minting..." : "Get 100 WAVE"}
				</button>
			</div>
		</main>
	);
};

export default FaucetPage;
