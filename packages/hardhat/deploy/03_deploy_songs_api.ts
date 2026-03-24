import { Contract } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploySongsPresenter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy } = hre.deployments;
	const SongsModel = await hre.ethers.getContract<Contract>("SongsModel", deployer);

	await deploy("SongsPresenter", {
		from: deployer,
		args: [await SongsModel.getAddress()],
		log: true,
		autoMine: true
	});
};

export default deploySongsPresenter;

deploySongsPresenter.tags = ["SongsPresenter"];
deploySongsPresenter.dependencies = ["SongsModel"];
