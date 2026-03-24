import { expect } from "chai";
import { ethers } from "hardhat";

describe("RoyaltiesDistribution", function () {
	let royaltiesDistribution: any;
	let owner: any;
	let buyer: any;

	before(async () => {
		[owner, buyer] = await ethers.getSigners();
	});

	beforeEach(async function () {
		const RoyaltiesDistribution = await ethers.getContractFactory("RoyaltiesDistribution");

		royaltiesDistribution = await RoyaltiesDistribution.deploy(owner, 10, 100, 30);
	});

	it("Should calculate available parts", async function () {
		expect(await royaltiesDistribution.getAvailableParts()).to.equal(70);
	});

	it("Should calculate total price", async function () {
		expect(await royaltiesDistribution.getTotalPrice(5)).to.equal(50);
	});

	it("Should decrase available parts after buy", async function () {
		await royaltiesDistribution.buyParts(buyer, 5);

		expect(await royaltiesDistribution.getAvailableParts()).to.equal(65);
	});

	it("Should return withdrawn balance", async function () {
		await royaltiesDistribution.buyParts(buyer, 10);

		await royaltiesDistribution.distributeRevenue(100);

		expect(await royaltiesDistribution.withdraw.staticCall(buyer)).to.equal(10);
	});

	// TODO: FINISH TESTS
});
