"use client";

import { formatUnits, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract, useSmartAccount } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth/notification";

const FaucetPage = () => {
	const { isConnected } = useAccount();
	const { activeAddress, smartAccountAddress, smartAccountModeEnabled } = useSmartAccount();
	const { writeContractAsync: writeWavecoinAsync, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});
	const { data: balance } = useScaffoldReadContract({
		contractName: "Wavecoin",
		functionName: "balanceOf",
		args: [activeAddress],
		query: { enabled: Boolean(activeAddress) }
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
				{smartAccountModeEnabled && (
					<div className="text-center text-sm opacity-80">
						<div>Gas sponsorship enabled</div>
						<div>Smart account: {smartAccountAddress ?? "Not created yet"}</div>
					</div>
				)}
				<div className="text-center">
					<span>Your balance: </span>
					<strong>{balance ? `${formatUnits(balance, 18)} WAVE` : "-"}</strong>
				</div>
				<button className="primary-button" onClick={handleMint} disabled={isPending || !isConnected}>
					{isPending ? "Minting..." : "Get 100 WAVE"}
				</button>
			</div>
		</main>
	);
};

export default FaucetPage;
