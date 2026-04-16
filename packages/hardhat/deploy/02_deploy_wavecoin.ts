import { Contract } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployWavecoin: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy } = hre.deployments;
	const SongsModel = await hre.ethers.getContract<Contract>("SongsModel", deployer);

	await deploy("Wavecoin", {
		from: deployer,
		args: [deployer, await SongsModel.getAddress()],
		log: true,
		autoMine: true
	});
};

export default deployWavecoin;

deployWavecoin.tags = ["Wavecoin"];
deployWavecoin.dependencies = ["SongsModel"];
