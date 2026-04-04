"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { uploadFile } from "~~/services/files/fileService";
import { notification } from "~~/utils/scaffold-eth/notification";

const GENRES = [
	"20th Century Classical",
	"African",
	"Afrobeat",
	"Alternative Hip-Hop",
	"Ambient",
	"Ambient Electronic",
	"Americana",
	"Asia-Far East",
	"Audio Collage",
	"Avant-Garde",
	"Balkan",
	"Big Band/Swing",
	"Black-Metal",
	"Bluegrass",
	"Blues",
	"Brazilian",
	"Breakbeat",
	"Breakcore - Hard",
	"British Folk",
	"Celtic",
	"Chamber Music",
	"Chill-out",
	"Chip Music",
	"Chiptune",
	"Choral Music",
	"Classical",
	"Comedy",
	"Composed Music",
	"Contemporary Classical",
	"Country",
	"Country & Western",
	"Cumbia",
	"Dance",
	"Death-Metal",
	"Disco",
	"Downtempo",
	"Drone",
	"Drum & Bass",
	"Dubstep",
	"Easy Listening",
	"Electro-Punk",
	"Electroacoustic",
	"Electronic",
	"Experimental",
	"Experimental Pop",
	"Field Recordings",
	"Folk",
	"Freak-Folk",
	"Free-Folk",
	"Free-Jazz",
	"Funk",
	"Garage",
	"Glitch",
	"Goth",
	"Grindcore",
	"Hardcore",
	"Hip-Hop",
	"Hip-Hop Beats",
	"House",
	"IDM",
	"Improv",
	"Indian",
	"Indie-Rock",
	"Industrial",
	"Instrumental",
	"International",
	"Jazz",
	"Jazz: Out",
	"Jazz: Vocal",
	"Jungle",
	"Kid-Friendly",
	"Klezmer",
	"Krautrock",
	"Latin",
	"Latin America",
	"Lo-Fi",
	"Loud-Rock",
	"Lounge",
	"Metal",
	"Middle East",
	"Minimal Electronic",
	"Minimalism",
	"Modern Jazz",
	"Musique Concrete",
	"New Age",
	"New Wave",
	"No Wave",
	"Noise",
	"Noise-Rock",
	"North African",
	"Nu-Jazz",
	"Old-Time / Historic",
	"Pop",
	"Post-Punk",
	"Post-Rock",
	"Power-Pop",
	"Progressive",
	"Psych-Folk",
	"Psych-Rock",
	"Punk",
	"Rap",
	"Reggae - Dancehall",
	"Reggae - Dub",
	"Rock",
	"Rock Opera",
	"Rockabilly",
	"Salsa",
	"Shoegaze",
	"Singer-Songwriter",
	"Sludge",
	"Soul-RnB",
	"Sound Art",
	"Sound Collage",
	"Soundtrack",
	"Space-Rock",
	"Surf",
	"Symphony",
	"Synth Pop",
	"Tango",
	"Techno",
	"Thrash",
	"Trip-Hop",
	"Unclassifiable"
];

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

		try {
			setUploadingAlbum(true);

			const albumImageCid = await uploadFile(albumImage);
			console.log(`Album image uploaded to IPFS - CID: ${albumImageCid}`);

			if (!albumImageCid || albumImageCid.trim() === "") {
				throw new Error("Failed to upload album image to IPFS");
			}

			const albumTxHash = await writeAlbums({
				functionName: "addAlbum",
				args: [albumName, artistName, albumImageCid, genre, BigInt(year || "0")]
			});

			if (!albumTxHash) {
				throw new Error("Album transaction hash not returned");
			}

			if (!publicClient) {
				throw new Error("Public client not available");
			}

			const receipt = await publicClient.waitForTransactionReceipt({ hash: albumTxHash });

			const targetNetwork = scaffoldConfig.targetNetworks[0];
			const albumsAbi = deployedContracts[targetNetwork.id].SongsModel.abi;

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
			setGenre("");
			setYear("");
			setAlbumImage(null);

			const imageInput = document.querySelector('input[id="album-image"]') as HTMLInputElement;
			if (imageInput) {
				imageInput.value = "";
			}

			setUploadingAlbum(false);
			onAlbumCreated();
		} catch (e) {
			console.error("❌ Error creating album:", e);
			setUploadingAlbum(false);
			notification.error("Failed to create album");
		}
	};

	return (
		<div style={{ marginBottom: "3rem" }}>
			<div style={{ padding: "1rem 0" }}>
				<span className="title">Create Album</span>
			</div>
			<div style={{ marginBottom: "1rem" }}>
				<span className="info">Create a new album with a name and cover image</span>
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
						disabled={uploadingAlbum}
					/>
				</div>

				{/* Artist Name */}
				<div style={{ marginBottom: "1rem" }}>
					<label className="subtitle" htmlFor="artist-name" style={{ display: "block", marginBottom: "0.5rem" }}>
						Artist Name
					</label>
					<input
						id="album-artist"
						className="input"
						style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
						type="text"
						maxLength={256}
						value={artistName}
						onChange={e => setArtistName(e.target.value)}
						placeholder="Enter artist name"
						disabled={uploadingAlbum}
					/>
				</div>

				{/* Genre */}
				<div style={{ marginBottom: "1rem" }}>
					<label className="subtitle" htmlFor="album-genre" style={{ display: "block", marginBottom: "0.5rem" }}>
						Genre
					</label>
					<input
						id="album-genre"
						className="input"
						style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
						list="genre-options"
						value={genre}
						onChange={e => setGenre(e.target.value)}
						placeholder="Type to search genres..."
						disabled={uploadingAlbum}
					/>
					<datalist id="genre-options">
						{GENRES.map(g => (
							<option key={g} value={g} />
						))}
					</datalist>
				</div>

				{/* Year */}
				<div style={{ marginBottom: "1rem" }}>
					<label className="subtitle" htmlFor="album-year" style={{ display: "block", marginBottom: "0.5rem" }}>
						Year
					</label>
					<input
						id="album-year"
						className="input"
						style={{ width: "100%", padding: "0.8rem", position: "relative", zIndex: 0 }}
						type="number"
						min={1900}
						max={2099}
						value={year}
						onChange={e => setYear(e.target.value)}
						placeholder="Enter year"
						disabled={uploadingAlbum}
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
						disabled={uploadingAlbum}
					/>
					{imagePreview && (
						<div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
							<Image
								src={imagePreview}
								alt="Album cover preview"
								width={200}
								height={200}
								style={{
									borderRadius: "0.5rem",
									objectFit: "cover"
								}}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Create Album Button */}
			<button
				className="primary-button"
				style={{ background: "var(--color-primary)", cursor: "pointer" }}
				type="button"
				disabled={uploadingAlbum}
				onClick={createAlbum}
			>
				<span className="subtitle">{uploadingAlbum ? "Creating Album..." : "Create Album"}</span>
			</button>
		</div>
	);
}
