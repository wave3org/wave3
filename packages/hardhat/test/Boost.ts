import { expect } from "chai";
import { ethers } from "hardhat";

describe("Boost", function () {
	let songsModel: any;
	let songsFactory: any;
	let wavecoin: any;
	let owner: any;

	const BOOST_PRICE = ethers.parseEther("10");
	const BOOST_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

	before(async () => {
		[owner] = await ethers.getSigners();

		songsModel = await (await ethers.getContractFactory("SongsModel")).deploy();
		wavecoin = await (
			await ethers.getContractFactory("Wavecoin")
		).deploy(owner.address, owner.address, await songsModel.getAddress());
		await songsModel.setWavecoin(await wavecoin.getAddress());
		const songRoyalties = await (
			await ethers.getContractFactory("SongRoyalties")
		).deploy(await wavecoin.getAddress(), await songsModel.getAddress(), owner.address);
		await songsModel.setSongRoyalties(await songRoyalties.getAddress());
		songsFactory = await (
			await ethers.getContractFactory("SongsFactory")
		).deploy(await wavecoin.getAddress(), await songsModel.getAddress());

		// Mint enough WAVE for boosts
		await wavecoin.mint(ethers.parseEther("1000"));
	});

	async function addSong() {
		const tx = await songsFactory.connect(owner).addAlbum({
			name: "Test Album",
			artist: "Test Artist",
			genre: "Electronic",
			year: 2026,
			imageCID: "QmImage",
			songs: [
				{
					name: "Test Song",
					audioCID: "QmAudio",
					playFee: ethers.parseEther("1"),
					buyPrice: ethers.parseEther("10"),
					sellPrice: ethers.parseEther("6"),
					totalParts: 100,
					nonSellableParts: 30
				}
			]
		});
		const receipt = await tx.wait();
		const event = receipt.logs
			.map((log: any) => {
				try {
					return songsModel.interface.parseLog(log);
				} catch {
					return null;
				}
			})
			.find((e: any) => e?.name === "SongAdded");
		return event.args.id;
	}

	it("boosts a song and sets expiry ~30 days from now", async function () {
		const songId = await addSong();

		const before = await ethers.provider.getBlock("latest");
		await wavecoin.connect(owner).boostSong(songId);
		const after = await ethers.provider.getBlock("latest");

		const expiry = await songsModel.boostExpiry(songId);
		expect(expiry).to.be.gte(before!.timestamp + BOOST_DURATION);
		expect(expiry).to.be.lte(after!.timestamp + BOOST_DURATION);
	});

	it("extending an active boost stacks on top of current expiry", async function () {
		const songId = await addSong();

		await wavecoin.connect(owner).boostSong(songId);
		const expiryAfterFirst = await songsModel.boostExpiry(songId);

		await wavecoin.connect(owner).boostSong(songId);
		const expiryAfterSecond = await songsModel.boostExpiry(songId);

		expect(expiryAfterSecond).to.equal(expiryAfterFirst + BigInt(BOOST_DURATION));
	});

	it("reverts if the caller is not the song owner", async function () {
		const songId = await addSong();
		const [, notOwner] = await ethers.getSigners();

		await wavecoin.connect(notOwner).mint(BOOST_PRICE);
		await expect(wavecoin.connect(notOwner).boostSong(songId)).to.be.revertedWith("Not song owner");
	});

	it("reverts if the caller has insufficient WAVE", async function () {
		const songId = await addSong();
		const [, , broke] = await ethers.getSigners();

		// `broke` has no WAVE
		await expect(wavecoin.connect(broke).boostSong(songId)).to.be.revertedWith("Insufficient funds");
	});
});
