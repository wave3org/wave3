"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { decodeEventLog, parseEther } from "viem";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { uploadFile } from "~~/services/files/fileService";
import { notification } from "~~/utils/scaffold-eth/notification";

interface CreateAlbumFormProps {
	uploadingAlbum: boolean;
	albumName: string;
	setAlbumName: (name: string) => void;
	artistName: string;
	setArtistName: (name: string) => void;
	genre: string;
	setGenre: (genre: string) => void;
	year: string;
	setYear: (year: string) => void;
	albumImage: File | null;
	setAlbumImage: (file: File | null) => void;
	onAlbumCreated: () => void;
	setUploadingAlbum: (uploading: boolean) => void;
}

interface SongDraft {
	id: string;
	name: string;
	file: File | null;
	playFee: string;
	buyPrice: string;
	totalParts: string;
	nonSellableParts: string;
}

const DEFAULT_PLAY_FEE_WAVE = "1";
const DEFAULT_BUY_PRICE_WAVE = "10";
const DEFAULT_TOTAL_PARTS = "100";
const DEFAULT_NON_SELLABLE_PARTS = "30";

export default function CreateAlbumForm({
	uploadingAlbum,
	albumName,
	setAlbumName,
	artistName,
	setArtistName,
	genre,
	setGenre,
	year,
	setYear,
	albumImage,
	setAlbumImage,
	onAlbumCreated,
	setUploadingAlbum
}: CreateAlbumFormProps) {
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const songIdCounter = useRef(0);
	const [songs, setSongs] = useState<SongDraft[]>([
		{
			id: "song-0",
			name: "",
			file: null,
			playFee: DEFAULT_PLAY_FEE_WAVE,
			buyPrice: DEFAULT_BUY_PRICE_WAVE,
			totalParts: DEFAULT_TOTAL_PARTS,
			nonSellableParts: DEFAULT_NON_SELLABLE_PARTS
		}
	]);
	const { writeContractAsync: writeAlbums } = useScaffoldWriteContract({ contractName: "SongsFactory" });
	const publicClient = usePublicClient();

	useEffect(() => {
		if (albumImage) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(albumImage);
		} else {
			setImagePreview(null);
		}
	}, [albumImage]);

	const handleAlbumImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target?.files?.[0];
		if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
			setAlbumImage(file);
		} else {
			notification.error("Please select a PNG or JPG image");
			e.target.value = "";
		}
	};

	const addSongRow = () => {
		songIdCounter.current += 1;
		setSongs(prev => [
			...prev,
			{
				id: `song-${songIdCounter.current}`,
				name: "",
				file: null,
				playFee: DEFAULT_PLAY_FEE_WAVE,
				buyPrice: DEFAULT_BUY_PRICE_WAVE,
				totalParts: DEFAULT_TOTAL_PARTS,
				nonSellableParts: DEFAULT_NON_SELLABLE_PARTS
			}
		]);
	};

	const removeSongRow = (id: string) => {
		if (songs.length <= 1) {
			return;
		}
		setSongs(prev => prev.filter(song => song.id !== id));
	};

	const updateSongName = (id: string, name: string) => {
		setSongs(prev => prev.map(song => (song.id === id ? { ...song, name } : song)));
	};

	const updateSongFile = (id: string, file: File | null) => {
		setSongs(prev => prev.map(song => (song.id === id ? { ...song, file } : song)));
	};

	const updateSongPlayFee = (id: string, value: string) => {
		setSongs(prev => prev.map(song => (song.id === id ? { ...song, playFee: value } : song)));
	};

	const updateSongBuyPrice = (id: string, value: string) => {
		setSongs(prev => prev.map(song => (song.id === id ? { ...song, buyPrice: value } : song)));
	};

	const updateSongTotalParts = (id: string, value: string) => {
		setSongs(prev => prev.map(song => (song.id === id ? { ...song, totalParts: value } : song)));
	};

	const updateSongNonSellableParts = (id: string, value: string) => {
		setSongs(prev => prev.map(song => (song.id === id ? { ...song, nonSellableParts: value } : song)));
	};

	const handleSongFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target?.files?.[0];
		if (file && file.type === "audio/mpeg") {
			updateSongFile(id, file);
			return;
		}

		notification.error("Please select an MP3 file");
		e.target.value = "";
	};

	const createAlbum = async () => {
		if (!albumName.trim()) {
			notification.error("Album name is required");
			return;
		}
		if (!artistName.trim()) {
			notification.error("Artist name is required");
			return;
		}
		if (!albumImage) {
			notification.error("Album image is required");
			return;
		}
		if (songs.length === 0 || songs.some(song => !song.name.trim() || !song.file)) {
			notification.error("All songs must include a title and MP3 file");
			return;
		}
		if (songs.some(song => Number(song.playFee) <= 0 || Number(song.buyPrice) <= 0)) {
			notification.error("Play fee and buy price must be greater than 0");
			return;
		}
		if (songs.some(song => !Number.isInteger(Number(song.totalParts)) || Number(song.totalParts) < 100)) {
			notification.error("Total parts must be an integer of at least 100");
			return;
		}
		if (
			songs.some(song => {
				const totalParts = Number(song.totalParts);
				const nonSellableParts = Number(song.nonSellableParts);
				return !Number.isInteger(nonSellableParts) || nonSellableParts < 1 || nonSellableParts > totalParts;
			})
		) {
			notification.error("Artist retained parts must be an integer between 1 and total parts");
			return;
		}

		try {
			setUploadingAlbum(true);

			const albumImageCid = await uploadFile(albumImage);
			console.log(`Album image uploaded to IPFS - CID: ${albumImageCid}`);

			if (!albumImageCid || albumImageCid.trim() === "") {
				throw new Error("Failed to upload album image to IPFS");
			}

			const uploadedSongs = [];
			for (const song of songs) {
				const songFile = song.file;
				if (!songFile) {
					throw new Error(`Missing file for song ${song.name}`);
				}

				const songCid = await uploadFile(songFile);
				if (!songCid || songCid.trim() === "") {
					throw new Error(`Failed to upload song \"${song.name}\" to IPFS`);
				}

				uploadedSongs.push({
					name: song.name.trim(),
					audioCID: songCid,
					playFee: parseEther(song.playFee),
					buyPrice: parseEther(song.buyPrice),
					totalParts: BigInt(song.totalParts),
					nonSellableParts: BigInt(song.nonSellableParts)
				});
			}

			const addAlbumRequest = {
				name: albumName.trim(),
				artist: artistName.trim(),
				genre: genre.trim(),
				year: BigInt(year || "0"),
				imageCID: albumImageCid,
				songs: uploadedSongs
			};

			const albumTxHash = await writeAlbums({
				functionName: "addAlbum",
				args: [addAlbumRequest] as unknown as never
			});

			if (!albumTxHash) {
				throw new Error("Album transaction hash not returned");
			}

			if (!publicClient) {
				throw new Error("Public client not available");
			}

			const receipt = await publicClient.waitForTransactionReceipt({ hash: albumTxHash });

			const targetNetwork = scaffoldConfig.targetNetworks[0];
			const targetNetworkId = targetNetwork.id as keyof typeof deployedContracts;
			const songsModelContract = deployedContracts[targetNetworkId]?.SongsModel;
			if (!songsModelContract) {
				throw new Error(`SongsModel ABI not found for network ${targetNetwork.id}`);
			}
			const albumsAbi = songsModelContract.abi;

			let albumId: bigint | null = null;
			for (const log of receipt.logs) {
				try {
					const decoded = decodeEventLog({
						abi: albumsAbi,
						data: log.data,
						topics: log.topics
					});
					if (decoded.eventName === "AlbumAdded") {
						albumId = (decoded.args as unknown as Record<string, bigint>).id;
						break;
					}
				} catch {
					continue;
				}
			}

			if (albumId === null) {
				throw new Error("Failed to get album ID from transaction");
			}

			console.log(`Album created with ID: ${albumId}`);
			notification.success("Album created successfully!");

			setAlbumName("");
			setArtistName("");
			setGenre("");
			setYear("");
			setAlbumImage(null);
			songIdCounter.current = 0;
			setSongs([
				{
					id: "song-0",
					name: "",
					file: null,
					playFee: DEFAULT_PLAY_FEE_WAVE,
					buyPrice: DEFAULT_BUY_PRICE_WAVE,
					totalParts: DEFAULT_TOTAL_PARTS,
					nonSellableParts: DEFAULT_NON_SELLABLE_PARTS
				}
			]);

			const imageInput = document.querySelector('input[id="album-image"]') as HTMLInputElement;
			if (imageInput) {
				imageInput.value = "";
			}

			const songFileInputs = document.querySelectorAll('input[id^="song-file-"]');
			songFileInputs.forEach(input => {
				if (input instanceof HTMLInputElement) {
					input.value = "";
				}
			});

			setUploadingAlbum(false);
			onAlbumCreated();
		} catch (e) {
			console.error("Error creating album:", e);
			setUploadingAlbum(false);
			notification.error("Failed to create album");
		}
	};

	return (
		<div className="mb-12">
			<div className="rounded-3xl border border-base-300/70 bg-base-100/95 p-6 shadow-2xl backdrop-blur-sm md:p-8">
				<div className="mb-6">
					<h2 className="text-2xl font-black md:text-3xl">Album Details</h2>
					<p className="mt-2 text-sm text-base-content/65">
						Your album and all songs are published together in one blockchain transaction.
					</p>
				</div>

				<div className="grid gap-5 md:grid-cols-2">
					<div>
						<label className="label font-bold" htmlFor="album-name">
							Album Name
						</label>
						<input
							id="album-name"
							className="input input-bordered w-full rounded-xl"
							type="text"
							maxLength={256}
							value={albumName}
							onChange={e => setAlbumName(e.target.value)}
							placeholder="Enter album name"
							disabled={uploadingAlbum}
						/>
					</div>

					<div>
						<label className="label font-bold" htmlFor="artist-name">
							Artist Name
						</label>
						<input
							id="album-artist"
							className="input input-bordered w-full rounded-xl"
							type="text"
							maxLength={256}
							value={artistName}
							onChange={e => setArtistName(e.target.value)}
							placeholder="Enter artist name"
							disabled={uploadingAlbum}
						/>
					</div>

					<div>
						<label className="label font-bold" htmlFor="album-genre">
							Genre
						</label>
						<input
							id="album-genre"
							className="input input-bordered w-full rounded-xl"
							value={genre}
							onChange={e => setGenre(e.target.value)}
							placeholder="Write any genre"
							disabled={uploadingAlbum}
						/>
					</div>

					<div>
						<label className="label font-bold" htmlFor="album-year">
							Year
						</label>
						<input
							id="album-year"
							className="input input-bordered w-full rounded-xl"
							type="number"
							min={1900}
							max={2099}
							value={year}
							onChange={e => setYear(e.target.value)}
							placeholder="Enter year"
							disabled={uploadingAlbum}
						/>
					</div>
				</div>

				<div className="mt-6 rounded-2xl border border-base-300/80 bg-base-200/45 p-4 md:p-5">
					<label className="label font-bold" htmlFor="album-image">
						Album Image (PNG or JPG)
					</label>
					<input
						id="album-image"
						className="file-input file-input-bordered w-full rounded-xl"
						type="file"
						accept="image/png,image/jpeg"
						onChange={handleAlbumImageChange}
						disabled={uploadingAlbum}
					/>
					{imagePreview && (
						<div className="mt-4 flex justify-center rounded-xl bg-base-100 p-3">
							<Image
								src={imagePreview}
								alt="Album cover preview"
								width={200}
								height={200}
								className="rounded-lg object-cover"
							/>
						</div>
					)}
				</div>

				<div className="mt-8">
					<div className="mb-4 flex items-end justify-between gap-4">
						<div>
							<h3 className="text-xl font-black">Songs</h3>
							<p className="text-sm text-base-content/65">Add all tracks now. They will be included in your album.</p>
						</div>
						<button type="button" className="btn btn-outline rounded-xl" onClick={addSongRow} disabled={uploadingAlbum}>
							Add Song
						</button>
					</div>

					<div className="space-y-4">
						{songs.map((song, index) => (
							<div key={song.id} className="rounded-2xl border border-base-300/80 bg-base-200/50 p-4">
								<div className="mb-3 flex items-center justify-between">
									<span className="font-bold">Track {index + 1}</span>
									{songs.length > 1 && (
										<button
											type="button"
											className="btn btn-error btn-sm rounded-lg"
											onClick={() => removeSongRow(song.id)}
											disabled={uploadingAlbum}
										>
											Remove
										</button>
									)}
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<label className="label font-bold" htmlFor={`song-name-${song.id}`}>
											Song Name
										</label>
										<input
											id={`song-name-${song.id}`}
											className="input input-bordered w-full rounded-xl"
											type="text"
											maxLength={256}
											value={song.name}
											onChange={e => updateSongName(song.id, e.target.value)}
											placeholder="Enter track title"
											disabled={uploadingAlbum}
										/>
									</div>

									<div>
										<label className="label font-bold" htmlFor={`song-file-${song.id}`}>
											Song File (MP3)
										</label>
										<input
											id={`song-file-${song.id}`}
											className="file-input file-input-bordered w-full rounded-xl"
											type="file"
											accept="audio/mpeg"
											onChange={e => handleSongFileChange(song.id, e)}
											disabled={uploadingAlbum}
										/>
									</div>

									<div className="md:col-span-2 grid grid-cols-2 gap-4">
										<div>
											<label className="label font-bold" htmlFor={`song-play-fee-${song.id}`}>
												Play Fee (WAVE)
											</label>
											<input
												id={`song-play-fee-${song.id}`}
												className="input input-bordered input-sm w-full rounded-xl"
												type="number"
												min="1"
												step="1"
												value={song.playFee}
												onChange={e => updateSongPlayFee(song.id, e.target.value)}
												disabled={uploadingAlbum}
											/>
										</div>

										<div>
											<label className="label font-bold" htmlFor={`song-buy-price-${song.id}`}>
												Part Buy Price (WAVE)
											</label>
											<input
												id={`song-buy-price-${song.id}`}
												className="input input-bordered input-sm w-full rounded-xl"
												type="number"
												min="1"
												step="1"
												value={song.buyPrice}
												onChange={e => updateSongBuyPrice(song.id, e.target.value)}
												disabled={uploadingAlbum}
											/>
										</div>
									</div>
									<details className="md:col-span-2 rounded-xl border border-base-300/80 bg-base-100/70 p-3">
										<summary className="cursor-pointer text-sm font-bold">Advanced parts configuration</summary>
										<div className="mt-3 grid gap-4 md:grid-cols-2">
											<div>
												<label className="label font-bold" htmlFor={`song-total-parts-${song.id}`}>
													Total Parts
												</label>
												<input
													id={`song-total-parts-${song.id}`}
													className="input input-bordered input-sm w-full rounded-xl"
													type="number"
													min="100"
													step="1"
													value={song.totalParts}
													onChange={e => updateSongTotalParts(song.id, e.target.value)}
													disabled={uploadingAlbum}
												/>
											</div>

											<div>
												<label className="label font-bold" htmlFor={`song-non-sellable-parts-${song.id}`}>
													Artist Retained Parts
												</label>
												<input
													id={`song-non-sellable-parts-${song.id}`}
													className="input input-bordered input-sm w-full rounded-xl"
													type="number"
													min="1"
													max={song.totalParts}
													step="1"
													value={song.nonSellableParts}
													onChange={e => updateSongNonSellableParts(song.id, e.target.value)}
													disabled={uploadingAlbum}
												/>
											</div>
										</div>
										<p className="mt-2 text-xs text-base-content/60">
											Parts available for primary sale:{" "}
											{Math.max(0, Number(song.totalParts || 0) - Number(song.nonSellableParts || 0))}
										</p>
									</details>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<button
				className="btn btn-primary mt-6 w-full rounded-xl text-base"
				type="button"
				disabled={uploadingAlbum}
				onClick={createAlbum}
			>
				{uploadingAlbum ? <span className="loading loading-spinner loading-sm"></span> : null}
				{uploadingAlbum ? "Uploading Files and Creating Album..." : "Create Album with Songs"}
			</button>
		</div>
	);
}
