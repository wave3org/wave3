"use client";

import { useEffect, useState } from "react";
import AddSongsForm from "./_components/AddSongsForm";
import CreateAlbumForm from "./_components/CreateAlbumForm";
import { notification } from "~~/utils/scaffold-eth/notification";

interface Album {
	albumId: bigint;
	name: string;
	artist: string;
	imageCID: string;
}

export default function UploadPage() {
	const [albumName, setAlbumName] = useState("");
	const [albumImage, setAlbumImage] = useState<File | null>(null);
	const [uploadingAlbum, setUploadingAlbum] = useState(false);

	const [albums, setAlbums] = useState<Album[]>([]);
	const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");

	useEffect(() => {
		fetchAlbums();
	}, []);

	const fetchAlbums = async () => {
		try {
			const ponderUrl = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
			const response = await fetch(`${ponderUrl}/albums`);
			if (response.ok) {
				const data = await response.json();
				setAlbums(data.items || []);
			} else {
				notification.error("Failed to load albums from database");
			}
		} catch (error) {
			console.error("❌ Failed to fetch albums:", error);
			notification.error("Cannot load albums from database");
		}
	};

	return (
		<div className="content-container">
			<CreateAlbumForm
				uploadingAlbum={uploadingAlbum}
				albumName={albumName}
				setAlbumName={setAlbumName}
				albumImage={albumImage}
				setAlbumImage={setAlbumImage}
				setUploadingAlbum={setUploadingAlbum}
				onAlbumCreated={() => {
					fetchAlbums();
				}}
			/>

			<AddSongsForm
				uploadingSongs={uploadingAlbum}
				albums={albums}
				selectedAlbumId={selectedAlbumId}
				setSelectedAlbumId={setSelectedAlbumId}
			/>
		</div>
	);
}
