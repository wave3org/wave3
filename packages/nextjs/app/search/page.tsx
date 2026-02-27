"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { FaPlay } from "react-icons/fa";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { playSong } from "~~/components/MusicPlayer";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { getFileUrl } from "~~/services/files/fileService";
import { payToPlaySong } from "~~/services/songs/playSongService";
import { type SongFromPonder, fetchSongsFromPonder } from "~~/services/songs/ponderSongService";
import { notification } from "~~/utils/scaffold-eth/notification";

const SearchPage: NextPage = () => {
	const [songs, setSongs] = useState<SongFromPonder[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const { writeContractAsync: writeWavecoin } = useScaffoldWriteContract({ contractName: "Wavecoin" });
	const { writeContractAsync: writeRoyalties } = useScaffoldWriteContract({ contractName: "SongRoyalties" });
	const { address: ownerAddress, chain } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();
	const targetNetwork = scaffoldConfig.targetNetworks[0];
	const wavecoinAddress = deployedContracts[targetNetwork.id].Wavecoin.address;
	const royaltiesAddress = deployedContracts[targetNetwork.id].SongRoyalties.address;

	useEffect(() => {
		const loadSongs = async () => {
			setLoading(true);
			try {
				const fetchedSongs = await fetchSongsFromPonder(searchQuery || undefined);
				setSongs(fetchedSongs);
			} catch (error) {
				console.error("❌ Failed to fetch songs:", error);
				notification.error("Failed to load songs from database");
				setSongs([]);
			}
			setLoading(false);
		};

		const debounceTimer = setTimeout(() => {
			loadSongs();
		}, 300);

		return () => clearTimeout(debounceTimer);
	}, [searchQuery]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2">Search Songs</h1>
				<p className="text-gray-600">Browse the latest uploaded songs</p>
			</div>

			<div className="mb-6">
				<input
					type="text"
					placeholder="Search songs by name..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			{loading ? (
				<div className="text-center py-12">
					<p className="text-xl text-gray-500">Loading songs...</p>
				</div>
			) : !songs || songs.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-xl text-gray-500">
						{searchQuery ? "No songs found matching your search" : "No songs uploaded yet"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{songs.map(song => (
						<div
							key={song.audioCID}
							className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
						>
							{song.album?.imageCID && (
								<Image
									src={getFileUrl(song.album.imageCID)}
									alt={`${song.album.name} cover`}
									width={400}
									height={256}
									className="w-full h-64 object-cover"
								/>
							)}
							<div className="p-4">
								<div className="mb-3">
									<h3 className="text-xl font-semibold mb-1">{song.name}</h3>
									{song.album && <p className="text-sm text-gray-500">{song.album.name}</p>}
								</div>
								<button
									onClick={async () => {
										try {
											if (!publicClient || !ownerAddress || !chain?.id) {
												notification.error("Wallet not connected");
												return;
											}
											await payToPlaySong({
												songId: song.songId,
												ownerAddress,
												chainId: chain.id,
												wavecoinAddress,
												royaltiesAddress,
												writeWavecoin,
												writeRoyalties,
												publicClient,
												walletClient: walletClient ?? undefined
											});
											playSong({
												id: song.songId,
												title: song.name,
												artist: song.album?.artist || "Unknown Artist",
												audioUrl: getFileUrl(song.audioCID),
												cover: song.album?.imageCID ? getFileUrl(song.album.imageCID) : undefined
											});
										} catch (e) {
											console.error("Error playing song:", e);
											const errorMessage = e instanceof Error ? e.message : "Unknown error";
											notification.error(`Failed to play song: ${errorMessage}`);
										}
									}}
									style={{
										width: "100%",
										padding: "0.75rem",
										background: "#4f46e5",
										color: "white",
										border: "none",
										borderRadius: "0.5rem",
										cursor: "pointer",
										fontSize: "1rem",
										fontWeight: "500",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: "0.5rem"
									}}
								>
									<FaPlay size={12} /> Play
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default SearchPage;
