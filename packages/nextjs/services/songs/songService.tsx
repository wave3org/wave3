import { SongMetadata } from "~~/types/songMetadata";

const MOCK_SONGS_METADATA: SongMetadata[] = [
	{
		id: "0f4a852d-d14c-40b1-aa40-39fc6b790bb5",
		image: {
			cid: "bafkreihu6ck7cgln5zebgfwxwaoke2ba6kxqgjhomx3djwau7jvdvrkb6i",
			width: 230,
			height: 230,
			alt: "Sleepless"
		},
		cid: "bafybeihm7zgmfdqjtpk5sv56k6gwbo67nvgkhviyr4jwnqxrikop5ipifu",
		title: "Sleepless",
		artist: "Diffie Bosman",
		price: 1.2,
		shares: 1000,
		availableShares: 300
	},
	{
		id: "67945b22-2b9c-400e-b3d0-1109bcf64186",
		image: {
			cid: "bafkreiea3ro5eg3t5a4guzs2t4nxvjymlnie2v4bxyor7qd26sb6lkuvbq",
			width: 230,
			height: 230,
			alt: "Ventris"
		},
		cid: "bafybeiaivnha7kjbb4xex5dwdlcqnrzjfajxhxcv2x5ef2c5eo3qga2dfa",
		title: "Ventris",
		artist: "Eugene Schott",
		price: 2.5,
		shares: 1000,
		availableShares: 400
	},
	{
		id: "cd990906-dc64-48f3-8f2b-5d8590814a7f",
		image: {
			cid: "bafkreihu6ck7cgln5zebgfwxwaoke2ba6kxqgjhomx3djwau7jvdvrkb6i",
			width: 230,
			height: 230,
			alt: "Sleepless"
		},
		cid: "bafybeihm7zgmfdqjtpk5sv56k6gwbo67nvgkhviyr4jwnqxrikop5ipifu",
		title: "Sleepless",
		artist: "Diffie Bosman",
		price: 1.2,
		shares: 1000,
		availableShares: 300
	},
	{
		id: "32c3cd35-ec37-4055-9f97-adcbc7a4137a",
		image: {
			cid: "bafkreiea3ro5eg3t5a4guzs2t4nxvjymlnie2v4bxyor7qd26sb6lkuvbq",
			width: 230,
			height: 230,
			alt: "Ventris"
		},
		cid: "bafybeiaivnha7kjbb4xex5dwdlcqnrzjfajxhxcv2x5ef2c5eo3qga2dfa",
		title: "Ventris",
		artist: "Eugene Schott",
		price: 2.5,
		shares: 1000,
		availableShares: 400
	},
	{
		id: "0a1a7b77-22f3-4737-9184-55b631d54c8d",
		image: {
			cid: "bafkreihu6ck7cgln5zebgfwxwaoke2ba6kxqgjhomx3djwau7jvdvrkb6i",
			width: 230,
			height: 230,
			alt: "Sleepless"
		},
		cid: "bafybeihm7zgmfdqjtpk5sv56k6gwbo67nvgkhviyr4jwnqxrikop5ipifu",
		title: "Sleepless",
		artist: "Diffie Bosman",
		price: 1.2,
		shares: 1000,
		availableShares: 300
	},
	{
		id: "e3fbf6b7-cfbe-405d-8988-b0147822acf9",
		image: {
			cid: "bafkreiea3ro5eg3t5a4guzs2t4nxvjymlnie2v4bxyor7qd26sb6lkuvbq",
			width: 230,
			height: 230,
			alt: "Ventris"
		},
		cid: "bafybeiaivnha7kjbb4xex5dwdlcqnrzjfajxhxcv2x5ef2c5eo3qga2dfa",
		title: "Ventris",
		artist: "Eugene Schott",
		price: 2.5,
		shares: 1000,
		availableShares: 400
	}
];

export const fetchSongsMetadata = (): SongMetadata[] => {
	return MOCK_SONGS_METADATA;
};

export const fetchSongMetadata = (id: string): SongMetadata | null => {
	let result: SongMetadata | null = null;

	for (const songMetadata of MOCK_SONGS_METADATA) {
		if (songMetadata.id == id) {
			result = songMetadata;
			break;
		}
	}

	return result;
};
