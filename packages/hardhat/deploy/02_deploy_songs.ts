import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deploySongs: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Songs", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const Songs = await hre.ethers.getContract<Contract>("Songs", deployer);
  console.log(`Songs deployed at address: ${Songs.address}`);
};

export default deploySongs;

deploySongs.tags = ["Songs"];
