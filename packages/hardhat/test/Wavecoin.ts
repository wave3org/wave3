import { expect } from "chai";
import { ethers } from "hardhat";

describe("Wavecoin", function () {
  let wavecoin: any;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    const Wavecoin = await ethers.getContractFactory("Wavecoin");
    wavecoin = await Wavecoin.deploy();
  });

  it("Should mint tokens", async function () {
    await wavecoin.mint(ethers.parseEther("100"));
    expect(await wavecoin.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
  });
});
