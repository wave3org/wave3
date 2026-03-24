import { Contract } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploySongsFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy } = hre.deployments;
	const Wavecoin = await hre.ethers.getContract<Contract>("Wavecoin", deployer);
	const SongsModel = await hre.ethers.getContract<Contract>("SongsModel", deployer);

	await deploy("SongsFactory", {
		from: deployer,
		args: [await Wavecoin.getAddress(), await SongsModel.getAddress()],
		log: true,
		autoMine: true
	});
};

export default deploySongsFactory;

deploySongsFactory.tags = ["SongsFactory"];
deploySongsFactory.dependencies = ["Wavecoin", "SongsModel"];
