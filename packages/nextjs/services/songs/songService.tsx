import { SongMetadata } from "~~/types/songMetadata";

const MOCK_SONGS_METADATA: SongMetadata[] = [
	{
		id: "0f4a852d-d14c-40b1-aa40-39fc6b790bb5",
		image: {
			src: "https://cdn.bensound.com/image/cover/diffiebosman-winterbeams.jpg",
			width: 230,
			height: 230,
			alt: "Sleepless"
		},
		url: "https://cdn.bensound.com/bensound-sleepless.mp3",
		title: "Sleepless",
		artist: "Diffie Bosman",
		price: 1.2,
		shares: 1000,
		availableShares: 300
	},
	{
		id: "67945b22-2b9c-400e-b3d0-1109bcf64186",
		image: {
			src: "https://cdn.bensound.com/image/cover/eugenschott-glitchtones.jpg",
			width: 230,
			height: 230,
			alt: "Ventris"
		},
		url: "https://cdn.bensound.com/bensound-ventris.mp3",
		title: "Ventris",
		artist: "Eugene Schott",
		price: 2.5,
		shares: 1000,
		availableShares: 400
	},
	{
		id: "cd990906-dc64-48f3-8f2b-5d8590814a7f",
		image: {
			src: "https://cdn.bensound.com/image/cover/diffiebosman-winterbeams.jpg",
			width: 230,
			height: 230,
			alt: "Sleepless"
		},
		url: "https://cdn.bensound.com/bensound-sleepless.mp3",
		title: "Sleepless",
		artist: "Diffie Bosman",
		price: 1.2,
		shares: 1000,
		availableShares: 300
	},
	{
		id: "32c3cd35-ec37-4055-9f97-adcbc7a4137a",
		image: {
			src: "https://cdn.bensound.com/image/cover/eugenschott-glitchtones.jpg",
			width: 230,
			height: 230,
			alt: "Ventris"
		},
		url: "https://cdn.bensound.com/bensound-ventris.mp3",
		title: "Ventris",
		artist: "Eugene Schott",
		price: 2.5,
		shares: 1000,
		availableShares: 400
	},
	{
		id: "0a1a7b77-22f3-4737-9184-55b631d54c8d",
		image: {
			src: "https://cdn.bensound.com/image/cover/diffiebosman-winterbeams.jpg",
			width: 230,
			height: 230,
			alt: "Sleepless"
		},
		url: "https://cdn.bensound.com/bensound-sleepless.mp3",
		title: "Sleepless",
		artist: "Diffie Bosman",
		price: 1.2,
		shares: 1000,
		availableShares: 300
	},
	{
		id: "e3fbf6b7-cfbe-405d-8988-b0147822acf9",
		image: {
			src: "https://cdn.bensound.com/image/cover/eugenschott-glitchtones.jpg",
			width: 230,
			height: 230,
			alt: "Ventris"
		},
		url: "https://cdn.bensound.com/bensound-ventris.mp3",
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
