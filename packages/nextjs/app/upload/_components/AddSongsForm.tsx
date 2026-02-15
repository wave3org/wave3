"use client";

import { useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadFile } from "~~/services/files/fileService";
import { notification } from "~~/utils/scaffold-eth/notification";

interface Song {
	id: string;
	name: string;
	file: File | null;
}

interface Album {
	albumId: bigint;
	name: string;
	artist: string;
	imageCID: string;
}

interface AddSongsFormProps {
	uploadingSongs: boolean;
	albums: Album[];
	selectedAlbumId: string;
	setSelectedAlbumId: (id: string) => void;
}

export default function AddSongsForm({
	uploadingSongs,
	albums,
	selectedAlbumId,
	setSelectedAlbumId
}: AddSongsFormProps) {
	const { address } = useAccount();
	const songIdCounter = useRef(0);
	const [songs, setSongs] = useState<Song[]>([{ id: "song-0", name: "", file: null }]);
	const [uploading, setUploading] = useState(false);

	const { writeContractAsync: writeSongs } = useScaffoldWriteContract({ contractName: "Songs" });

	// Filter albums to only show user's albums
	const userAlbums = albums.filter(album => album.artist.toLowerCase() === address?.toLowerCase());

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

	const handleSongFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target?.files?.[0];
		if (file && file.type === "audio/mpeg") {
			updateSongFile(id, file);
		} else {
			notification.error("Please select an MP3 file");
			e.target.value = "";
		}
	};

	const addSongsToAlbum = async () => {
		if (!selectedAlbumId) {
			notification.error("Please select an album");
			return;
		}
		if (songs.some(song => !song.name.trim() || !song.file)) {
			notification.error("All songs must have a name and file");
			return;
		}

		try {
			setUploading(true);

			const albumId = BigInt(selectedAlbumId);

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
			notification.success("Songs added successfully!");

			songIdCounter.current = 0;
			setSongs([{ id: "song-0", name: "", file: null }]);

			const inputs = document.querySelectorAll('input[id^="song-"]');
			inputs.forEach((input: Element) => {
				if (input instanceof HTMLInputElement) {
					input.value = "";
				}
			});
		} catch (e) {
			console.log(e);
			setUploading(false);
			notification.error("Error adding songs");
		}
	};

	return (
		<div>
			<div style={{ padding: "1rem 0" }}>
				<span className="title">Add Songs</span>
			</div>
			<div style={{ marginBottom: "1rem" }}>
				<span className="info">Add one or more songs to an existing album</span>
			</div>

			<div
				style={{
					background: "var(--color-secondary)",
					borderRadius: "0.8rem",
					padding: "1.5rem",
					marginBottom: "1.5rem"
				}}
			>
				{/* Album Selection */}
				<div style={{ marginBottom: "1.5rem" }}>
					<label className="subtitle" htmlFor="album-select" style={{ display: "block", marginBottom: "0.5rem" }}>
						Select Album
					</label>
					<select
						id="album-select"
						className="input"
						style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
						value={selectedAlbumId}
						onChange={e => setSelectedAlbumId(e.target.value)}
						disabled={uploading || uploadingSongs}
					>
						<option value="">Choose an album...</option>
						{userAlbums.map(album => (
							<option key={album.albumId.toString()} value={album.albumId.toString()}>
								{album.name}
							</option>
						))}
					</select>
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
									disabled={uploading || uploadingSongs}
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
								disabled={uploading || uploadingSongs}
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
								disabled={uploading || uploadingSongs}
							/>
						</div>
					</div>
				))}

				<button
					type="button"
					className="primary-button"
					style={{ marginTop: "0.5rem", background: "var(--color-primary)", cursor: "pointer" }}
					onClick={addSong}
					disabled={uploading || uploadingSongs}
				>
					<span className="subtitle">+ Add Song</span>
				</button>
			</div>

			{/* Add Songs Button */}
			<button
				className="primary-button"
				style={{ marginBottom: "2rem", background: "var(--color-primary)", cursor: "pointer" }}
				type="button"
				disabled={uploading || uploadingSongs}
				onClick={addSongsToAlbum}
			>
				<span className="subtitle">{uploading ? "Adding Songs..." : "Add Songs to Album"}</span>
			</button>
		</div>
	);
}
