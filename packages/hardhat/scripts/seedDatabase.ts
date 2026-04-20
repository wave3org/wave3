import { ethers } from "hardhat";
import songsFactoryDeployment from "../deployments/localhost/SongsFactory.json";
import wavecoinDeployment from "../deployments/localhost/Wavecoin.json";

async function main() {
	const signers = await ethers.getSigners();
	const [, artist, ...users] = signers;

	const SongsFactory = await ethers.getContractFactory("SongsFactory");
	const songsFactory = SongsFactory.attach(songsFactoryDeployment.address) as any;

	const Wavecoin = await ethers.getContractFactory("Wavecoin");
	const wavecoin = Wavecoin.attach(wavecoinDeployment.address) as any;

	console.log("Creating seed album and songs...");
	await songsFactory.connect(artist).addAlbum({
		name: "Wave3 Seed Album",
		artist: "Wave3 Artist",
		genre: "Electronic",
		year: 2026,
		imageCID: "ipfs://wave3-seed-cover",
		songs: Array.from({ length: 10 }, (_, index) => ({
			name: `Wave3 Song ${index}`,
			audioCID: `ipfs://wave3-song-${index}`,
			playFee: ethers.parseEther("1"),
			partPrice: ethers.parseEther("10"),
			totalParts: 100,
			nonSellableParts: 30
		}))
	});

	console.log("Minting WAVE to test listeners...");
	const mintAmount = ethers.parseEther("1000");
	for (const user of users.slice(0, 15)) {
		await wavecoin.connect(user).mint(mintAmount);
	}

	console.log("Generating SongPlayed events...");
	for (const [userIndex, user] of users.slice(0, 15).entries()) {
		for (let offset = 0; offset < 5; offset++) {
			const songId = (userIndex + offset) % 10;
			await wavecoin.connect(user).buyPlay(BigInt(songId));
		}
	}

	console.log("Seed data created successfully.");
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
