"use client";

import { useRef, useState } from "react";
import { parseEther } from "viem";
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

	const { writeContractAsync: writeSongs } = useScaffoldWriteContract({ contractName: "SongsFactory" });

	// Filter albums to only show user's albums (if connected)
	const userAlbums = address ? albums.filter(album => album.artist.toLowerCase() === address.toLowerCase()) : albums;

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
						args: [
							song.name,
							songCid,
							BigInt(albumId),
							parseEther("1"),
							parseEther("10"),
							BigInt(100),
							BigInt(30),
							"0x0000000000000000000000000000000000000000"
						]
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
			console.error("❌ Error adding songs:", e);
			setUploading(false);
			notification.error("Failed to add songs");
		}
	};

	return (
		<div>
			<div className="py-4">
				<h2 className="text-2xl font-bold">Agregar Canciones</h2>
			</div>
			<div className="mb-4">
				<p className="text-sm text-base-content/60">Agregá una o más canciones a un álbum existente</p>
			</div>

			<div className="bg-base-200 rounded-xl p-6 mb-6">
				{/* Album Selection */}
				<div className="mb-6">
					<label className="label font-bold" htmlFor="album-select">
						Seleccionar Álbum
					</label>
					<select
						id="album-select"
						className="select select-bordered w-full"
						value={selectedAlbumId}
						onChange={e => setSelectedAlbumId(e.target.value)}
						disabled={uploading || uploadingSongs}
					>
						<option value="">Elegí un álbum...</option>
						{userAlbums.map(album => (
							<option key={album.albumId.toString()} value={album.albumId.toString()}>
								{album.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Songs List */}
			<div className="mb-6">
				<div className="mb-4">
					<span className="font-bold">Canciones</span>
				</div>
				{songs.map((song, index) => (
					<div key={song.id} className="bg-base-200 rounded-xl p-6 mb-4">
						<div className="flex justify-between items-center mb-4">
							<span className="font-bold">Canción {index + 1}</span>
							{songs.length > 1 && (
								<button
									type="button"
									className="btn btn-error btn-sm"
									onClick={() => removeSong(song.id)}
									disabled={uploading || uploadingSongs}
								>
									Eliminar
								</button>
							)}
						</div>

						<div className="mb-4">
							<label className="label font-bold" htmlFor={`song-name-${song.id}`}>
								Nombre de la Canción
							</label>
							<input
								id={`song-name-${song.id}`}
								className="input input-bordered w-full"
								type="text"
								maxLength={256}
								value={song.name}
								onChange={e => updateSongName(song.id, e.target.value)}
								placeholder="Ingresá el nombre de la canción"
								disabled={uploading || uploadingSongs}
							/>
						</div>

						<div>
							<label className="label font-bold" htmlFor={`song-file-${song.id}`}>
								Archivo (MP3)
							</label>
							<input
								id={`song-file-${song.id}`}
								className="file-input file-input-bordered w-full"
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
					className="btn btn-outline w-full mt-2"
					onClick={addSong}
					disabled={uploading || uploadingSongs}
				>
					+ Agregar Canción
				</button>
			</div>

			{/* Add Songs Button */}
			<button
				className="btn btn-primary w-full mb-8"
				type="button"
				disabled={uploading || uploadingSongs}
				onClick={addSongsToAlbum}
			>
				{uploading ? <span className="loading loading-spinner loading-sm"></span> : null}
				{uploading ? "Agregando Canciones..." : "Agregar Canciones al Álbum"}
			</button>
		</div>
	);
}
