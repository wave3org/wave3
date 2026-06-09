import { expect } from "chai";
import { ethers } from "hardhat";

describe("SongRoyalties", function () {
	let songsModel: any;
	let songsFactory: any;
	let songRoyalties: any;
	let wavecoin: any;
	let artist: any;
	let buyer: any;
	let receiver: any;

	beforeEach(async () => {
		[artist, buyer, receiver] = await ethers.getSigners();

		const SongsModel = await ethers.getContractFactory("SongsModel");
		songsModel = await SongsModel.deploy();

		const Wavecoin = await ethers.getContractFactory("Wavecoin");
		wavecoin = await Wavecoin.deploy(artist.address, await songsModel.getAddress());
		await songsModel.setWavecoin(await wavecoin.getAddress());

		const SongRoyalties = await ethers.getContractFactory("SongRoyalties");
		songRoyalties = await SongRoyalties.deploy(
			await wavecoin.getAddress(),
			await songsModel.getAddress(),
			artist.address
		);
		await songsModel.setSongRoyalties(await songRoyalties.getAddress());

		const SongsFactory = await ethers.getContractFactory("SongsFactory");
		songsFactory = await SongsFactory.deploy(await wavecoin.getAddress(), await songsModel.getAddress());
	});

	const createSong = async () => {
		await songsFactory.connect(artist).addAlbum({
			name: "Album",
			artist: "Artist",
			genre: "Rock",
			year: 2026,
			imageCID: "QmImageCID",
			songs: [
				{
					name: "Song",
					audioCID: "QmAudioCID",
					playFee: 100,
					partPrice: 10,
					totalParts: 100,
					nonSellableParts: 30
				}
			]
		});
	};

	it("mints song parts as ERC1155 balances", async function () {
		await createSong();

		expect(await songRoyalties.balanceOf(artist.address, 0)).to.equal(100);
		expect(await songRoyalties["totalSupply(uint256)"](0)).to.equal(100);
		expect(await songRoyalties.getAvailableParts(0)).to.equal(70);
	});

	it("sells primary parts and lets holders transfer ERC1155 shares", async function () {
		await createSong();
		await wavecoin.connect(buyer).mint(100);

		await expect(wavecoin.connect(buyer).buyParts(0, 10))
			.to.emit(songsModel, "SongPurchase")
			.withArgs(0, buyer.address, 10);

		expect(await songRoyalties.balanceOf(buyer.address, 0)).to.equal(10);
		expect(await songRoyalties.balanceOf(artist.address, 0)).to.equal(90);
		expect(await songRoyalties.getAvailableParts(0)).to.equal(60);
		expect(await wavecoin.balanceOf(artist.address)).to.equal(100);

		await songRoyalties.connect(buyer).safeTransferFrom(buyer.address, receiver.address, 0, 4, "0x");

		expect(await songRoyalties.balanceOf(buyer.address, 0)).to.equal(6);
		expect(await songRoyalties.balanceOf(receiver.address, 0)).to.equal(4);
	});

	it("settles royalties for the holder that owned parts when revenue arrived", async function () {
		await createSong();
		await wavecoin.connect(buyer).mint(200);

		await wavecoin.connect(buyer).buyParts(0, 10);
		await wavecoin.connect(buyer).buyPlay(0);

		await songRoyalties.connect(buyer).safeTransferFrom(buyer.address, receiver.address, 0, 10, "0x");

		expect(await songRoyalties.pendingRoyalties(0, buyer.address)).to.equal(10);
		expect(await songRoyalties.pendingRoyalties(0, receiver.address)).to.equal(0);

		await wavecoin.connect(buyer).withdrawRoyalties(0);

		expect(await wavecoin.balanceOf(buyer.address)).to.equal(7);
		expect(await wavecoin.balanceOf(artist.address)).to.equal(103);
	});
});
