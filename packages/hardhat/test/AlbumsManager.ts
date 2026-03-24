import { expect } from "chai";
import { ethers } from "hardhat";

describe("AlbumsManager", function () {
	let albumsManager: any;
	let owner: any;

	before(async () => {
		[owner] = await ethers.getSigners();
		const AlbumsManager = await ethers.getContractFactory("AlbumsManager");
		albumsManager = await AlbumsManager.deploy();
	});

	it("Should create an album", async function () {
		await albumsManager.addAlbum(owner, "My Album", "Artist name", "QmImageCID");
		const album = await ethers.getContractAt("Album", await albumsManager.getAlbum(0));

		expect(await album.getOwner()).to.equal(owner.address);
		expect(await album.getName()).to.equal("My Album");
		expect(await album.getArtist()).to.equal("Artist name");
		expect(await album.getImageCID()).to.equal("QmImageCID");
	});

	// TODO: FINISH TESTS
});
