import { Contract } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployWavecoin: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, execute } = hre.deployments;
	const SongsModel = await hre.ethers.getContract<Contract>("SongsModel", deployer);

	const wavecoin = await deploy("Wavecoin", {
		from: deployer,
		args: [deployer, deployer, await SongsModel.getAddress()],
		log: true,
		autoMine: true
	});

	if (wavecoin.newlyDeployed) {
		await execute("SongsModel", { from: deployer, log: true }, "setWavecoin", wavecoin.address);
	}
};

export default deployWavecoin;

deployWavecoin.tags = ["Wavecoin"];
deployWavecoin.dependencies = ["SongsModel"];
