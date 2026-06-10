import { ethers } from "hardhat";
import songsFactoryDeployment from "../deployments/localhost/SongsFactory.json";

async function main() {
	console.log("Creating mock data.");

	const [artist1, artist2, artist3] = await ethers.getSigners();
	const SongsFactory = await ethers.getContractFactory("SongsFactory");
	const songsFactory = SongsFactory.attach(songsFactoryDeployment.address) as any;

	await songsFactory.connect(artist1).addAlbum({
		name: "Winter beams",
		artist: "Diffie Bosman",
		genre: "Alternative",
		year: 2020,
		imageCID: "bafkreihu6ck7cgln5zebgfwxwaoke2ba6kxqgjhomx3djwau7jvdvrkb6i",
		songs: [
			{
				name: "Sleepless",
				audioCID: "bafybeihm7zgmfdqjtpk5sv56k6gwbo67nvgkhviyr4jwnqxrikop5ipifu",
				playFee: BigInt(1 * 10 ** 18),
				buyPrice: BigInt(10 * 10 ** 18),
				totalParts: 100,
				nonSellableParts: 30
			},
			{
				name: "Ghost town",
				audioCID: "bafybeih6bzjb56qfje4mfdcepz52zm44jzf3bduwkc3yzxgnajyhvgety4",
				playFee: BigInt(1 * 10 ** 18),
				buyPrice: BigInt(10 * 10 ** 18),
				totalParts: 100,
				nonSellableParts: 30
			}
		]
	});

	await songsFactory.connect(artist2).addAlbum({
		name: "Glitch Tones",
		artist: "Eugene Schott",
		genre: "Alternative",
		year: 2021,
		imageCID: "bafkreiea3ro5eg3t5a4guzs2t4nxvjymlnie2v4bxyor7qd26sb6lkuvbq",
		songs: [
			{
				name: "Ventris",
				audioCID: "bafybeiaivnha7kjbb4xex5dwdlcqnrzjfajxhxcv2x5ef2c5eo3qga2dfa",
				playFee: BigInt(2 * 10 ** 18),
				buyPrice: BigInt(15 * 10 ** 18),
				totalParts: 100,
				nonSellableParts: 40
			},
			{
				name: "Crashing lights",
				audioCID: "bafybeiffqnknealh4pl6fjvvvyfzius64p65apuxrj2r7qckj7m7byhyh4",
				playFee: BigInt(2 * 10 ** 18),
				buyPrice: BigInt(15 * 10 ** 18),
				totalParts: 100,
				nonSellableParts: 40
			}
		]
	});

	await songsFactory.connect(artist3).addAlbum({
		name: "Mezzanine",
		artist: "Straight White Teeth",
		genre: "Alternative",
		year: 2019,
		imageCID: "bafkreibvahphcmudbzul4o7y3tafhbh3uvu4lro6rg7dmpczvb6act4ngi",
		songs: [
			{
				name: "Mezzanine",
				audioCID: "bafybeifviw5hxx6do3ww44uynvq2lg3uaqfydb6pmn6kyvvkdyha57sj6q",
				playFee: BigInt(1 * 10 ** 18),
				buyPrice: BigInt(5 * 10 ** 18),
				totalParts: 100,
				nonSellableParts: 51
			},
			{
				name: "YML",
				audioCID: "bafybeigfq4vs5o76sgb4woioszryfhzzyts3a3dazhxqltdwtkzro3udya",
				playFee: BigInt(1 * 10 ** 18),
				buyPrice: BigInt(5 * 10 ** 18),
				totalParts: 100,
				nonSellableParts: 51
			}
		]
	});

	console.log("Mock data created.");
}

main().catch(console.error);
