import { parseEther } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

export async function payToPlaySong(songId: string, writeContract: any, publicClient: any): Promise<void> {
	const targetNetwork = scaffoldConfig.targetNetworks[0];
	const wavecoinAddress = deployedContracts[targetNetwork.id].Wavecoin.address;
	const wavecoinAbi = deployedContracts[targetNetwork.id].Wavecoin.abi;
	const royaltiesAddress = deployedContracts[targetNetwork.id].SongRoyalties.address;
	const royaltiesAbi = deployedContracts[targetNetwork.id].SongRoyalties.abi;

	const approveTxHash = await writeContract({
		address: wavecoinAddress,
		abi: wavecoinAbi,
		functionName: "approve",
		args: [royaltiesAddress, parseEther("1")]
	});

	await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

	const playTxHash = await writeContract({
		address: royaltiesAddress,
		abi: royaltiesAbi,
		functionName: "playSong",
		args: [BigInt(songId)]
	});

	await publicClient.waitForTransactionReceipt({ hash: playTxHash });
}
