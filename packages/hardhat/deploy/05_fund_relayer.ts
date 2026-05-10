import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Must match DEFAULT_HARDHAT_RELAYER_PRIVATE_KEY in packages/nextjs/app/api/smart-account/relay/route.ts
const HARDHAT_RELAYER_ADDRESS = "0xbB686fe983cCA3013a4701C5359029e50d61f6C0";
const FUND_AMOUNT = "1"; // ETH

const fundRelayer: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
		return;
	}

	const { deployer } = await hre.getNamedAccounts();
	const deployerSigner = await hre.ethers.getSigner(deployer);
	const amountWei = hre.ethers.parseEther(FUND_AMOUNT);

	const currentBalance = await hre.ethers.provider.getBalance(HARDHAT_RELAYER_ADDRESS);
	if (currentBalance >= amountWei) {
		console.log(`Relayer already funded (${hre.ethers.formatEther(currentBalance)} ETH), skipping.`);
		return;
	}

	const tx = await deployerSigner.sendTransaction({
		to: HARDHAT_RELAYER_ADDRESS,
		value: amountWei
	});
	await tx.wait();
	console.log(`Funded relayer ${HARDHAT_RELAYER_ADDRESS} with ${FUND_AMOUNT} ETH`);
};

export default fundRelayer;

fundRelayer.tags = ["FundRelayer"];
fundRelayer.dependencies = ["Wave3SmartAccountFactory"];
