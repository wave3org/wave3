import { Contract } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploySongRoyalties: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, execute } = hre.deployments;
	const Wavecoin = await hre.ethers.getContract<Contract>("Wavecoin", deployer);
	const SongsModel = await hre.ethers.getContract<Contract>("SongsModel", deployer);

	const songRoyalties = await deploy("SongRoyalties", {
		from: deployer,
		args: [await Wavecoin.getAddress(), await SongsModel.getAddress(), deployer],
		log: true,
		autoMine: true
	});

	if (songRoyalties.newlyDeployed) {
		await execute("SongsModel", { from: deployer, log: true }, "setSongRoyalties", songRoyalties.address);
	}
};

export default deploySongRoyalties;

deploySongRoyalties.tags = ["SongRoyalties"];
deploySongRoyalties.dependencies = ["Wavecoin", "SongsModel"];
