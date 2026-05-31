import { expect } from "chai";
import { ethers } from "hardhat";

// buyPrice=10, sellPrice=6, spread=4 per part
const BUY_PRICE = 10n;
const SELL_PRICE = 6n;
const TOTAL_PARTS = 100n;
const NON_SELLABLE = 30n;

describe("SongsManager", function () {
	let wavecoin: any;
	let songsManager: any;
	let owner: any;
	let buyer: any;

	let songCounter = 0n;

	// Helper: add a song and return the Song contract
	async function addSong(name = "My Song") {
		const id = songCounter++;
		await songsManager.addSong(
			owner.address,
			name,
			"QmAudioCID",
			0,
			1,
			BUY_PRICE,
			SELL_PRICE,
			TOTAL_PARTS,
			NON_SELLABLE,
			await wavecoin.getAddress()
		);
		return ethers.getContractAt("Song", await songsManager.getSong(id));
	}

	before(async () => {
		[owner, buyer] = await ethers.getSigners();
		const SongsManager = await ethers.getContractFactory("SongsManager");
		songsManager = await SongsManager.deploy();
		// Deploy a minimal Wavecoin so Song constructor is happy (no real transfers in these tests)
		const Wavecoin = await ethers.getContractFactory("Wavecoin");
		wavecoin = await Wavecoin.deploy(owner.address, owner.address, await songsManager.getAddress());
	});

	describe("addSong", function () {
		it("Should create a song with correct metadata", async function () {
			const song = await addSong();
			expect(await song.getOwner()).to.equal(owner.address);
			expect(await song.getName()).to.equal("My Song");
			expect(await song.getAudioCID()).to.equal("QmAudioCID");
			expect(await song.getAlbumId()).to.equal(0n);
			expect(await song.getPlayFee()).to.equal(1n);
			expect(await song.getTotalParts()).to.equal(TOTAL_PARTS);
			expect(await song.getAvailableParts()).to.equal(TOTAL_PARTS - NON_SELLABLE);
		});

		it("Should expose buyPrice and sellPrice (not a single partPrice)", async function () {
			const song = await addSong();
			expect(await song.getBuyPrice()).to.equal(BUY_PRICE);
			expect(await song.getSellPrice()).to.equal(SELL_PRICE);
		});

		it("Should calculate total price based on buyPrice", async function () {
			const song = await addSong();
			expect(await song.getTotalPrice(5)).to.equal(5n * BUY_PRICE);
		});
	});

	describe("buyParts via Song", function () {
		it("Should decrease available parts after buy", async function () {
			const song = await addSong();
			await song.buyParts(buyer.address, 15);
			expect(await song.getAvailableParts()).to.equal(TOTAL_PARTS - NON_SELLABLE - 15n);
		});

		it("Should revert if buying more than available", async function () {
			const song = await addSong();
			await expect(song.buyParts(buyer.address, 71)).to.be.revertedWith("Not enough parts available");
		});
	});

	describe("sellParts via Song", function () {
		it("Should restore available parts after sell", async function () {
			const song = await addSong();
			await song.buyParts(buyer.address, 10);
			await song.sellParts(buyer.address, 10);
			expect(await song.getAvailableParts()).to.equal(TOTAL_PARTS - NON_SELLABLE);
		});

		it("Should return sellPrice * parts as refund amount", async function () {
			const song = await addSong();
			await song.buyParts(buyer.address, 5);
			const refund = await song.sellParts.staticCall(buyer.address, 5);
			expect(refund).to.equal(5n * SELL_PRICE);
		});
	});
});
