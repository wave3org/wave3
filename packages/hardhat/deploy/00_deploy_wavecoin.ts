import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployWavecoin: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Wavecoin", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const Wavecoin = await hre.ethers.getContract<Contract>("Wavecoin", deployer);
  console.log(`Wavecoin deployed at address: ${Wavecoin.address}`);
};

export default deployWavecoin;

deployWavecoin.tags = ["Wavecoin"];
