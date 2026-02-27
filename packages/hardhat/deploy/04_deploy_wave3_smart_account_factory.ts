import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployWave3SmartAccountFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Wave3SmartAccountFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const factory = await hre.ethers.getContract<Contract>("Wave3SmartAccountFactory", deployer);
  console.log(`Wave3SmartAccountFactory deployed at address: ${factory.address}`);
};

export default deployWave3SmartAccountFactory;

deployWave3SmartAccountFactory.tags = ["Wave3SmartAccountFactory"];
