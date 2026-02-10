import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployAlbums: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Albums", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const Albums = await hre.ethers.getContract<Contract>("Albums", deployer);
  console.log(`Albums deployed at address: ${Albums.address}`);
};

export default deployAlbums;

deployAlbums.tags = ["Albums"];
