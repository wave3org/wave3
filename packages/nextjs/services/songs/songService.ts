import { fetchFeatured, fetchNewReleases, fetchTrending } from "../recommendations/recommendationService";
import { createPublicClient, http } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";
import { SongMetadata } from "~~/types/songMetadata";
import { SongMetadataResponse } from "~~/types/songMetadataResponse";

class SongPresenterClient {
	private publicClient;
	private songsPresenterContract;

	constructor() {
		const targetNetwork = scaffoldConfig.targetNetworks[0];
		const targetNetworkId = targetNetwork.id as keyof typeof deployedContracts;

		this.songsPresenterContract = deployedContracts[targetNetworkId]?.SongsPresenter;

		this.publicClient = createPublicClient({
			chain: targetNetwork,
			transport: http()
		});
	}

	private async fetchSong(id: bigint): Promise<SongMetadata | null> {
		return (await this.publicClient.readContract({
			address: this.songsPresenterContract.address,
			abi: this.songsPresenterContract.abi,
			functionName: "getSong",
			args: [id]
		})) as unknown as SongMetadata;
	}

	public async fetchSongs(ids: bigint[]): Promise<SongMetadata[] | null> {
		const songMetadataResponse: SongMetadataResponse = (await this.publicClient.readContract({
			address: this.songsPresenterContract.address,
			abi: this.songsPresenterContract.abi,
			functionName: "getSongs",
			args: [ids]
		})) as unknown as SongMetadataResponse;

		return songMetadataResponse.songs;
	}

	public async fetchFeaturedSong(userAddress: string): Promise<SongMetadata | null> {
		const songId: bigint = await fetchFeatured(userAddress);

		return await this.fetchSong(songId);
	}

	public async fetchNewlyReleasedSongs(): Promise<SongMetadata[] | null> {
		const songIds: bigint[] = await fetchNewReleases();

		return await this.fetchSongs(songIds);
	}

	public async fetchTrendingSongs(): Promise<SongMetadata[] | null> {
		const songIds: bigint[] = await fetchTrending();

		return await this.fetchSongs(songIds);
	}
}

const songPresenterClient = new SongPresenterClient();

export async function fetchFeaturedSong(userAddress: string): Promise<SongMetadata | null> {
	return await songPresenterClient.fetchFeaturedSong(userAddress);
}

export async function fetchNewlyReleasedSongs(): Promise<SongMetadata[] | null> {
	return await songPresenterClient.fetchNewlyReleasedSongs();
}

export async function fetchTrendingSongs(): Promise<SongMetadata[] | null> {
	return await songPresenterClient.fetchTrendingSongs();
}

export async function fetchSongs(songIds: bigint[]): Promise<SongMetadata[] | null> {
	return await songPresenterClient.fetchSongs(songIds);
}
