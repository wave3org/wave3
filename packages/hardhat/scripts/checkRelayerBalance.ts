import * as dotenv from "dotenv";
import { formatEther, isHexString, JsonRpcProvider, parseEther, Wallet } from "ethers";
dotenv.config();

const DEFAULT_MIN_BALANCE_ETH = "0.02";

const getRpcUrl = (networkName: string) => {
	const genericRpc = process.env.SMART_ACCOUNT_RPC_URL;
	if (genericRpc) {
		return genericRpc;
	}

	const normalized = networkName.toLowerCase();
	if (normalized === "localhost" || normalized === "hardhat") {
		return process.env.SMART_ACCOUNT_RPC_URL_HARDHAT || "http://127.0.0.1:8545";
	}

	if (normalized === "sepolia") {
		if (process.env.SMART_ACCOUNT_RPC_URL_SEPOLIA) {
			return process.env.SMART_ACCOUNT_RPC_URL_SEPOLIA;
		}
		const alchemyApiKey = process.env.ALCHEMY_API_KEY || "cR4WnXePioePZ5fFrnSiR";
		return `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
	}

	throw new Error(`Unsupported network "${networkName}". Set SMART_ACCOUNT_RPC_URL explicitly.`);
};

async function main() {
	const networkArgIndex = process.argv.indexOf("--network");
	const networkName = networkArgIndex !== -1 ? process.argv[networkArgIndex + 1] : "sepolia";

	const relayerPk = process.env.SMART_ACCOUNT_RELAYER_PRIVATE_KEY;
	if (!relayerPk || !isHexString(relayerPk, 32)) {
		throw new Error("SMART_ACCOUNT_RELAYER_PRIVATE_KEY is missing or invalid");
	}

	const minBalanceEth = process.env.RELAYER_MIN_BALANCE_ETH || DEFAULT_MIN_BALANCE_ETH;
	const minBalanceWei = parseEther(minBalanceEth);
	if (minBalanceWei <= 0n) {
		throw new Error("RELAYER_MIN_BALANCE_ETH must be greater than 0");
	}

	const rpcUrl = getRpcUrl(networkName);
	const provider = new JsonRpcProvider(rpcUrl);
	const wallet = new Wallet(relayerPk, provider);

	const [balance, chainId] = await Promise.all([provider.getBalance(wallet.address), provider.getNetwork()]);
	const balanceEth = formatEther(balance);

	console.log(`Relay balance check`);
	console.log(`  Network: ${networkName} (chainId=${chainId.chainId})`);
	console.log(`  Address: ${wallet.address}`);
	console.log(`  Balance: ${balanceEth} ETH`);
	console.log(`  Minimum required: ${minBalanceEth} ETH`);

	if (balance < minBalanceWei) {
		throw new Error(`Relayer balance too low (${balanceEth} ETH). Fund the relayer before deploy.`);
	}

	console.log("Relayer balance is sufficient.");
}

main().catch((error: any) => {
	console.error(error?.message || error);
	process.exit(1);
});
