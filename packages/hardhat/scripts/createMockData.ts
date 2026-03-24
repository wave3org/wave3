import { ethers } from "hardhat";
import songsFactoryDeployment from "../deployments/localhost/SongsFactory.json";

async function main() {
	console.log("Creating mock data.");

	const [artist1, artist2, artist3] = await ethers.getSigners();
	const SongsFactory = await ethers.getContractFactory("SongsFactory");
	const songsFactory = SongsFactory.attach(songsFactoryDeployment.address) as any;

	await songsFactory
		.connect(artist1)
		.addAlbum("Winter beams", "Diffie Bosman", "bafkreihu6ck7cgln5zebgfwxwaoke2ba6kxqgjhomx3djwau7jvdvrkb6i");
	await songsFactory
		.connect(artist1)
		.addSong(
			"Sleepless",
			"bafybeihm7zgmfdqjtpk5sv56k6gwbo67nvgkhviyr4jwnqxrikop5ipifu",
			0,
			BigInt(1 * 10 ** 18),
			BigInt(10 * 10 ** 18),
			100,
			30,
			ethers.ZeroAddress
		);

	await songsFactory
		.connect(artist1)
		.addSong(
			"Ghost town",
			"bafybeih6bzjb56qfje4mfdcepz52zm44jzf3bduwkc3yzxgnajyhvgety4",
			0,
			BigInt(1 * 10 ** 18),
			BigInt(10 * 10 ** 18),
			100,
			30,
			ethers.ZeroAddress
		);

	await songsFactory
		.connect(artist2)
		.addAlbum("Glitch Tones", "Eugene Schott", "bafkreiea3ro5eg3t5a4guzs2t4nxvjymlnie2v4bxyor7qd26sb6lkuvbq");

	await songsFactory
		.connect(artist2)
		.addSong(
			"Ventris",
			"bafybeiaivnha7kjbb4xex5dwdlcqnrzjfajxhxcv2x5ef2c5eo3qga2dfa",
			1,
			BigInt(2 * 10 ** 18),
			BigInt(15 * 10 ** 18),
			100,
			40,
			ethers.ZeroAddress
		);

	await songsFactory
		.connect(artist2)
		.addSong(
			"Crashing lights",
			"bafybeiffqnknealh4pl6fjvvvyfzius64p65apuxrj2r7qckj7m7byhyh4",
			1,
			BigInt(2 * 10 ** 18),
			BigInt(15 * 10 ** 18),
			100,
			40,
			ethers.ZeroAddress
		);

	await songsFactory
		.connect(artist3)
		.addAlbum("Mezzanine", "Straight White Teeth", "bafkreibvahphcmudbzul4o7y3tafhbh3uvu4lro6rg7dmpczvb6act4ngi");

	await songsFactory
		.connect(artist3)
		.addSong(
			"Mezzanine",
			"bafybeifviw5hxx6do3ww44uynvq2lg3uaqfydb6pmn6kyvvkdyha57sj6q",
			2,
			BigInt(1 * 10 ** 18),
			BigInt(5 * 10 ** 18),
			100,
			51,
			ethers.ZeroAddress
		);

	await songsFactory
		.connect(artist3)
		.addSong(
			"YML",
			"bafybeigfq4vs5o76sgb4woioszryfhzzyts3a3dazhxqltdwtkzro3udya",
			2,
			BigInt(1 * 10 ** 18),
			BigInt(5 * 10 ** 18),
			100,
			51,
			ethers.ZeroAddress
		);

	console.log("Mock data created.");
}

main().catch(console.error);
