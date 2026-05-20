import { createPublicClient, http } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

class WavecoinClient {
	private publicClient;
	private wavecoinContract;

	constructor() {
		const targetNetwork = scaffoldConfig.targetNetworks[0];
		const targetNetworkId = targetNetwork.id as keyof typeof deployedContracts;

		this.wavecoinContract = deployedContracts[targetNetworkId]?.Wavecoin;

		this.publicClient = createPublicClient({
			chain: targetNetwork,
			transport: http()
		});
	}

	public async fetchBalance(userAddress: string): Promise<bigint | null> {
		return (await this.publicClient.readContract({
			address: this.wavecoinContract.address,
			abi: this.wavecoinContract.abi,
			functionName: "balanceOf",
			args: [userAddress]
		})) as unknown as bigint;
	}
}

const wavecoinClient = new WavecoinClient();

export async function fetchBalance(userAddress: string): Promise<bigint | null> {
	return await wavecoinClient.fetchBalance(userAddress);
}
