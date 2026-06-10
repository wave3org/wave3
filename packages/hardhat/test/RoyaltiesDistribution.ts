import { expect } from "chai";
import { ethers } from "hardhat";

const BUY_PRICE = 10n;
const TOTAL_PARTS = 100n;
const NON_SELLABLE_PARTS = 30n;

describe("RoyaltiesDistribution", function () {
	let royaltiesDistribution: any;
	let owner: any;
	let buyer: any;

	before(async () => {
		[owner, buyer] = await ethers.getSigners();
	});

	beforeEach(async function () {
		const RoyaltiesDistribution = await ethers.getContractFactory("RoyaltiesDistribution");
		royaltiesDistribution = await RoyaltiesDistribution.deploy(
			owner.address,
			BUY_PRICE,
			TOTAL_PARTS,
			NON_SELLABLE_PARTS
		);
	});

	describe("Initial state", function () {
		it("Should report correct available parts", async function () {
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(70n);
		});

		it("Should return correct buyPrice", async function () {
			expect(await royaltiesDistribution.getBuyPrice()).to.equal(BUY_PRICE);
		});

		it("Should calculate total price based on buyPrice", async function () {
			expect(await royaltiesDistribution.getTotalPrice(5)).to.equal(5n * BUY_PRICE);
		});
	});

	describe("buyParts", function () {
		it("Should decrease available parts", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 5);
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(65n);
		});

		it("Should credit artist with the full buy price per part", async function () {
			const parts = 10n;
			await royaltiesDistribution.buyParts(buyer.address, parts);
			expect(await royaltiesDistribution.getPendingBalance(owner.address)).to.equal(parts * BUY_PRICE);
		});

		it("Artist can withdraw primary sale revenue immediately after purchase", async function () {
			const parts = 5n;
			await royaltiesDistribution.buyParts(buyer.address, parts);
			expect(await royaltiesDistribution.withdraw.staticCall(owner.address)).to.equal(parts * BUY_PRICE);
		});

		it("Should revert if not enough parts available", async function () {
			await expect(royaltiesDistribution.buyParts(buyer.address, 71)).to.be.revertedWith("Not enough parts available");
		});

		it("Multiple buys from same address accumulate parts", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 5);
			await royaltiesDistribution.buyParts(buyer.address, 3);
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(62n);
			expect(await royaltiesDistribution.getPendingBalance(owner.address)).to.equal(8n * BUY_PRICE);
		});
	});

	describe("distributeRevenue + withdraw", function () {
		it("Buyer receives royalties proportional to parts held", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 10);
			await royaltiesDistribution.distributeRevenue(100, 1);
			expect(await royaltiesDistribution.withdraw.staticCall(buyer.address)).to.equal(10n);
		});

		it("Withdraw resets balance to zero", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 10);
			await royaltiesDistribution.distributeRevenue(100, 1);
			await royaltiesDistribution.withdraw(buyer.address);
			expect(await royaltiesDistribution.getPendingBalance(buyer.address)).to.equal(0n);
		});

		it("Should revert withdraw if no balance", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 5);
			await expect(royaltiesDistribution.withdraw(buyer.address)).to.be.revertedWith(
				"Holder has no royalties to withdraw"
			);
		});

		it("Artist balance includes both primary sale revenue and royalties", async function () {
			const parts = 10n;
			await royaltiesDistribution.buyParts(buyer.address, parts);
			await royaltiesDistribution.distributeRevenue(100, 1);
			expect(await royaltiesDistribution.getPendingBalance(owner.address)).to.equal(parts * BUY_PRICE + 90n);
		});
	});
});
