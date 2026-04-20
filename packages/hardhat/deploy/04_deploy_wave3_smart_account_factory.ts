import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployWave3SmartAccountFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployer } = await hre.getNamedAccounts();
	const { deploy, execute } = hre.deployments;
	const wavecoin = await hre.deployments.get("Wavecoin");

	await deploy("Wave3SmartAccountFactory", {
		from: deployer,
		args: [wavecoin.address],
		log: true,
		autoMine: true
	});

	await execute(
		"Wavecoin",
		{ from: deployer, log: true },
		"setSmartAccountFactory",
		(await hre.deployments.get("Wave3SmartAccountFactory")).address
	);
};

export default deployWave3SmartAccountFactory;

deployWave3SmartAccountFactory.tags = ["Wave3SmartAccountFactory"];
deployWave3SmartAccountFactory.dependencies = ["Wavecoin"];
