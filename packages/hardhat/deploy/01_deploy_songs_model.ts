import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploySongsModel: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy } = hre.deployments;

	await deploy("SongsModel", {
		from: deployer,
		args: [],
		log: true,
		autoMine: true
	});
};

export default deploySongsModel;

deploySongsModel.tags = ["SongsModel"];
