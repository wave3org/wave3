import { expect } from "chai";
import { ethers } from "hardhat";

describe("SongsManager", function () {
	let wavecoin: any;
	let songsManager: any;
	let owner: any;
	let buyer: any;

	before(async () => {
		[owner, buyer, wavecoin] = await ethers.getSigners();
		const SongsManager = await ethers.getContractFactory("SongsManager");

		songsManager = await SongsManager.deploy();
	});

	it("Should create a song", async function () {
		await songsManager.addSong(owner, "My Song", "QmAudioCID", 0, 1, 10, 100, 30, wavecoin);
		const song = await ethers.getContractAt("Song", await songsManager.getSong(0));

		expect(await song.getOwner()).to.equal(owner.address);
		expect(await song.getName()).to.equal("My Song");
		expect(await song.getAudioCID()).to.equal("QmAudioCID");
		expect(await song.getAlbumId()).to.equal(0);
		expect(await song.getPlayFee()).to.equal(1);
		expect(await song.getPartPrice()).to.equal(10);
		expect(await song.getTotalParts()).to.equal(100);
		expect(await song.getAvailableParts()).to.equal(70);
	});

	it("Should return total price of parts", async function () {
		await songsManager.addSong(owner, "My Song", "QmAudioCID", 0, 1, 10, 100, 30, wavecoin);
		const song = await ethers.getContractAt("Song", await songsManager.getSong(0));

		expect(await song.getTotalPrice(5)).to.equal(50);
	});

	it("Should decrase available parts after buy", async function () {
		await songsManager.addSong(owner, "My Song", "QmAudioCID", 0, 1, 10, 100, 30, wavecoin);
		const song = await ethers.getContractAt("Song", await songsManager.getSong(0));

		await song.buyParts(buyer, 15);

		expect(await song.getAvailableParts()).to.equal(55);
	});

	// TODO: FINISH TESTS
});
