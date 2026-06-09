import { expect } from "chai";
import { ethers } from "hardhat";

// buyPrice=10, sellPrice=6, spread=4 per part
// totalParts=100, nonSellableParts=30 → availableParts=70
const BUY_PRICE = 10n;
const SELL_PRICE = 6n;
const TOTAL_PARTS = 100n;
const NON_SELLABLE_PARTS = 30n;

describe("RoyaltiesDistribution", function () {
	let royaltiesDistribution: any;
	let owner: any;
	let buyer: any;
	let buyer2: any;

	before(async () => {
		[owner, buyer, buyer2] = await ethers.getSigners();
	});

	beforeEach(async function () {
		const RoyaltiesDistribution = await ethers.getContractFactory("RoyaltiesDistribution");
		royaltiesDistribution = await RoyaltiesDistribution.deploy(
			owner.address,
			BUY_PRICE,
			SELL_PRICE,
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

		it("Should return correct sellPrice", async function () {
			expect(await royaltiesDistribution.getSellPrice()).to.equal(SELL_PRICE);
		});

		it("Should calculate total price based on buyPrice", async function () {
			expect(await royaltiesDistribution.getTotalPrice(5)).to.equal(5n * BUY_PRICE);
		});

		it("Should always report sell option as available", async function () {
			expect(await royaltiesDistribution.isSellOptionAvailable()).to.equal(true);
		});
	});

	describe("buyParts", function () {
		it("Should decrease available parts", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 5);
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(65n);
		});

		it("Should credit artist with spread per part", async function () {
			const parts = 10n;
			await royaltiesDistribution.buyParts(buyer.address, parts);
			// artist's pending balance = parts * (buyPrice - sellPrice)
			const expected = parts * (BUY_PRICE - SELL_PRICE);
			expect(await royaltiesDistribution.getPendingBalance(owner.address)).to.equal(expected);
		});

		it("Artist can withdraw spread immediately after purchase", async function () {
			const parts = 5n;
			await royaltiesDistribution.buyParts(buyer.address, parts);
			const expectedSpread = parts * (BUY_PRICE - SELL_PRICE);
			expect(await royaltiesDistribution.withdraw.staticCall(owner.address)).to.equal(expectedSpread);
		});

		it("Should revert if not enough parts available", async function () {
			await expect(royaltiesDistribution.buyParts(buyer.address, 71)).to.be.revertedWith("Not enough parts available");
		});

		it("Multiple buys from same address accumulate parts", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 5);
			await royaltiesDistribution.buyParts(buyer.address, 3);
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(62n);
			const expectedSpread = 8n * (BUY_PRICE - SELL_PRICE);
			expect(await royaltiesDistribution.getPendingBalance(owner.address)).to.equal(expectedSpread);
		});
	});

	describe("sellParts", function () {
		beforeEach(async function () {
			await royaltiesDistribution.buyParts(buyer.address, 10);
		});

		it("Should return sellPrice * parts to caller", async function () {
			const amount = await royaltiesDistribution.sellParts.staticCall(buyer.address, 5);
			expect(amount).to.equal(5n * SELL_PRICE);
		});

		it("Should restore available parts after sell", async function () {
			await royaltiesDistribution.sellParts(buyer.address, 5);
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(65n);
		});

		it("Should revert if seller has insufficient parts", async function () {
			await expect(royaltiesDistribution.sellParts(buyer.address, 11)).to.be.revertedWith("Not enough parts to sell");
		});

		it("Should revert if address never bought parts", async function () {
			await expect(royaltiesDistribution.sellParts(buyer2.address, 1)).to.be.revertedWith(
				"Seller does not hold any parts of this song"
			);
		});

		it("Full cycle: buy then sell restores available parts", async function () {
			// buy 10 more (total 20 bought, 50 available)
			await royaltiesDistribution.buyParts(buyer.address, 10);
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(50n);
			// sell all 20
			await royaltiesDistribution.sellParts(buyer.address, 20);
			expect(await royaltiesDistribution.getAvailableParts()).to.equal(70n);
		});
	});

	describe("distributeRevenue + withdraw", function () {
		it("Buyer receives royalties proportional to parts held", async function () {
			await royaltiesDistribution.buyParts(buyer.address, 10);
			// buyer holds 10/100 parts → gets 10% of 100 = 10
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

		it("Artist balance includes both spread and royalties", async function () {
			const parts = 10n;
			await royaltiesDistribution.buyParts(buyer.address, parts);
			const spread = parts * (BUY_PRICE - SELL_PRICE); // 40
			// artist holds 90/100 parts → gets 90% of 100 = 90 royalties
			await royaltiesDistribution.distributeRevenue(100, 1);
			const expectedArtistBalance = spread + 90n;
			expect(await royaltiesDistribution.getPendingBalance(owner.address)).to.equal(expectedArtistBalance);
		});
	});
});
