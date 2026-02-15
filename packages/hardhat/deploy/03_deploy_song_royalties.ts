import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deploySongRoyalties: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Get deployed contract addresses
  const wavecoin = await hre.deployments.get("Wavecoin");
  const albums = await hre.deployments.get("Albums");
  const songs = await hre.deployments.get("Songs");

  await deploy("SongRoyalties", {
    from: deployer,
    args: [wavecoin.address, albums.address, songs.address],
    log: true,
    autoMine: true,
  });

  const SongRoyalties = await hre.ethers.getContract<Contract>("SongRoyalties", deployer);
  console.log(`SongRoyalties deployed at address: ${SongRoyalties.address}`);
  console.log(`  - Wavecoin: ${wavecoin.address}`);
  console.log(`  - Albums: ${albums.address}`);
  console.log(`  - Songs: ${songs.address}`);
};

export default deploySongRoyalties;

deploySongRoyalties.tags = ["SongRoyalties"];
deploySongRoyalties.dependencies = ["Wavecoin", "Albums", "Songs"];
