import { expect } from "chai";
import { ethers } from "hardhat";

describe("Wavecoin", function () {
	let wavecoin: any;
	let owner: any;
	let other: any;

	before(async () => {
		[owner, other] = await ethers.getSigners();
		const Wavecoin = await ethers.getContractFactory("Wavecoin");
		// Use `other` as a stand-in SongsModel for the mint-only tests
		wavecoin = await Wavecoin.deploy(owner, owner, other);
	});

	it("Should mint tokens", async function () {
		await wavecoin.mint(ethers.parseEther("100"));

		expect(await wavecoin.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
	});

	// TODO: FINISH TESTS
});
