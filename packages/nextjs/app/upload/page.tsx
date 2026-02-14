"use client";

import { useRef, useState } from "react";
import { decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { uploadFile } from "~~/services/files/fileService";

interface Song {
	id: string;
	name: string;
	file: File | null;
}

export default function UploadAlbum() {
	const [albumName, setAlbumName] = useState("");
	const [artistName, setArtistName] = useState("");
	const [albumImage, setAlbumImage] = useState<File | null>(null);
	const songIdCounter = useRef(0);
	const [songs, setSongs] = useState<Song[]>([{ id: "song-0", name: "", file: null }]);
	const [uploading, setUploading] = useState(false);

	const { writeContractAsync: writeSongs } = useScaffoldWriteContract({ contractName: "Songs" });
	const { writeContractAsync: writeAlbums } = useScaffoldWriteContract({ contractName: "Albums" });
	const publicClient = usePublicClient();

	const addSong = () => {
		songIdCounter.current += 1;
		setSongs([...songs, { id: `song-${songIdCounter.current}`, name: "", file: null }]);
	};

	const removeSong = (id: string) => {
		if (songs.length > 1) {
			setSongs(songs.filter(song => song.id !== id));
		}
	};

	const updateSongName = (id: string, name: string) => {
		setSongs(songs.map(song => (song.id === id ? { ...song, name } : song)));
	};

	const updateSongFile = (id: string, file: File | null) => {
		setSongs(songs.map(song => (song.id === id ? { ...song, file } : song)));
	};

	const handleAlbumImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target?.files?.[0];
		if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
			setAlbumImage(file);
		} else {
			alert("Please select a PNG or JPG image");
			e.target.value = "";
		}
	};

	const handleSongFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target?.files?.[0];
		if (file && file.type === "audio/mpeg") {
			updateSongFile(id, file);
		} else {
			alert("Please select an MP3 file");
			e.target.value = "";
		}
	};

	const releaseAlbum = async () => {
		// Validations
		if (!albumName.trim()) {
			alert("Album name is required");
			return;
		}
		if (!artistName.trim()) {
			alert("Artist name is required");
			return;
		}
		if (!albumImage) {
			alert("Album image is required");
			return;
		}
		if (songs.some(song => !song.name.trim() || !song.file)) {
			alert("All songs must have a name and file");
			return;
		}

		try {
			setUploading(true);

			const albumImageCid = await uploadFile(albumImage);
			console.log(`Album image uploaded to IPFS - CID: ${albumImageCid}`);

			if (!albumImageCid || albumImageCid.trim() === "") {
				throw new Error("Failed to upload album image to IPFS");
			}

			const albumTxHash = await writeAlbums({
				functionName: "addAlbum",
				args: [albumName, artistName, albumImageCid]
			});

			if (!albumTxHash) {
				throw new Error("Album transaction hash not returned");
			}

			if (!publicClient) {
				throw new Error("Public client not available");
			}

			const receipt = await publicClient.waitForTransactionReceipt({ hash: albumTxHash });

			const targetNetwork = scaffoldConfig.targetNetworks[0];
			const albumsAbi = deployedContracts[targetNetwork.id].Albums.abi;

			let albumId: bigint | null = null;
			for (const log of receipt.logs) {
				try {
					const decoded = decodeEventLog({
						abi: albumsAbi,
						data: log.data,
						topics: log.topics
					});
					if (decoded.eventName === "AddedAlbum") {
						albumId = decoded.args.id as bigint;
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

			for (const song of songs) {
				if (song.file) {
					const songCid = await uploadFile(song.file);
					console.log(`Song uploaded to IPFS - Name: ${song.name}, CID: ${songCid}`);

					if (!songCid || songCid.trim() === "") {
						throw new Error(`Failed to upload song "${song.name}" to IPFS`);
					}

					await writeSongs({
						functionName: "addSong",
						args: [song.name, songCid, albumId]
					});
				}
			}

			setUploading(false);
			alert("Album released successfully!");

			// Reset form
			setAlbumName("");
			setArtistName("");
			setAlbumImage(null);
			songIdCounter.current = 0;
			setSongs([{ id: "song-0", name: "", file: null }]);

			// Clear file inputs
			const inputs = document.querySelectorAll('input[type="file"]');
			inputs.forEach((input: Element) => {
				if (input instanceof HTMLInputElement) {
					input.value = "";
				}
			});
		} catch (e) {
			console.log(e);
			setUploading(false);
			alert("Error uploading album");
		}
	};

	return (
		<div className="content-container">
			<div style={{ padding: "1rem 0" }}>
				<span className="title">Upload Album</span>
			</div>
			<div style={{ marginBottom: "1rem" }}>
				<span className="info">Upload your album to the platform</span>
			</div>

			<div
				style={{
					background: "var(--color-secondary)",
					borderRadius: "0.8rem",
					padding: "1.5rem",
					marginBottom: "1.5rem"
				}}
			>
				{/* Album Name */}
				<div style={{ marginBottom: "1rem" }}>
					<label className="subtitle" htmlFor="album-name" style={{ display: "block", marginBottom: "0.5rem" }}>
						Album Name
					</label>
					<input
						id="album-name"
						className="input"
						style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
						type="text"
						maxLength={256}
						value={albumName}
						onChange={e => setAlbumName(e.target.value)}
						placeholder="Enter album name"
					/>
				</div>

				{/* Artist Name */}
				<div style={{ marginBottom: "1rem" }}>
					<label className="subtitle" htmlFor="artist-name" style={{ display: "block", marginBottom: "0.5rem" }}>
						Artist Name
					</label>
					<input
						id="artist-name"
						className="input"
						style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
						type="text"
						maxLength={256}
						value={artistName}
						onChange={e => setArtistName(e.target.value)}
						placeholder="Enter artist name"
					/>
				</div>

				{/* Album Image */}
				<div style={{ marginBottom: "1rem" }}>
					<label className="subtitle" htmlFor="album-image" style={{ display: "block", marginBottom: "0.5rem" }}>
						Album Image (PNG or JPG)
					</label>
					<input
						id="album-image"
						className="input"
						style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
						type="file"
						accept="image/png,image/jpeg"
						onChange={handleAlbumImageChange}
					/>
				</div>
			</div>

			{/* Songs List */}
			<div style={{ marginBottom: "1.5rem" }}>
				<div style={{ marginBottom: "1rem" }}>
					<span className="subtitle">Songs</span>
				</div>
				{songs.map((song, index) => (
					<div
						key={song.id}
						style={{
							background: "var(--color-secondary)",
							borderRadius: "0.8rem",
							padding: "1.5rem",
							marginBottom: "1rem"
						}}
					>
						<div
							style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}
						>
							<span className="subtitle">Song {index + 1}</span>
							{songs.length > 1 && (
								<button
									type="button"
									style={{
										background: "var(--color-error)",
										color: "white",
										padding: "0.4rem 0.8rem",
										borderRadius: "25px",
										fontSize: "0.85rem",
										fontWeight: "bold"
									}}
									onClick={() => removeSong(song.id)}
								>
									Remove
								</button>
							)}
						</div>

						<div style={{ marginBottom: "1rem" }}>
							<label
								className="subtitle"
								htmlFor={`song-name-${song.id}`}
								style={{ display: "block", marginBottom: "0.5rem" }}
							>
								Song Name
							</label>
							<input
								id={`song-name-${song.id}`}
								className="input"
								style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
								type="text"
								maxLength={256}
								value={song.name}
								onChange={e => updateSongName(song.id, e.target.value)}
								placeholder="Enter song name"
							/>
						</div>

						<div>
							<label
								className="subtitle"
								htmlFor={`song-file-${song.id}`}
								style={{ display: "block", marginBottom: "0.5rem" }}
							>
								Song File (MP3)
							</label>
							<input
								id={`song-file-${song.id}`}
								className="input"
								style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
								type="file"
								accept="audio/mpeg"
								onChange={e => handleSongFileChange(song.id, e)}
							/>
						</div>
					</div>
				))}

				<button
					type="button"
					className="primary-button"
					style={{ marginTop: "0.5rem", background: "var(--color-primary)", cursor: "pointer" }}
					onClick={addSong}
					disabled={uploading}
				>
					<span className="subtitle">+ Add Song</span>
				</button>
			</div>

			{/* Release Album Button */}
			<button
				className="primary-button"
				style={{ marginBottom: "2rem", background: "var(--color-primary)", cursor: "pointer" }}
				type="button"
				disabled={uploading}
				onClick={releaseAlbum}
			>
				<span className="subtitle">{uploading ? "Releasing Album..." : "Release Album"}</span>
			</button>
		</div>
	);
}
