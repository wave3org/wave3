import { expect } from "chai";
import { ethers } from "hardhat";

describe("SongsManager", function () {
	let songsManager: any;
	let owner: any;

	before(async () => {
		[owner] = await ethers.getSigners();
		const SongsManager = await ethers.getContractFactory("SongsManager");

		songsManager = await SongsManager.deploy();
	});

	it("Should create a song", async function () {
		await songsManager.addSong(owner, "My Song", "QmAudioCID", 0, 1);
		const song = await ethers.getContractAt("Song", await songsManager.getSong(0));

		expect(await song.getOwner()).to.equal(owner.address);
		expect(await song.getName()).to.equal("My Song");
		expect(await song.getAudioCID()).to.equal("QmAudioCID");
		expect(await song.getAlbumId()).to.equal(0);
		expect(await song.getPlayFee()).to.equal(1);
	});

	// TODO: FINISH TESTS
});
