"use client";

import { useEffect, useState } from "react";
import AddSongsForm from "./_components/AddSongsForm";
import CreateAlbumForm from "./_components/CreateAlbumForm";

interface Album {
	albumId: bigint;
	name: string;
	artist: string;
	imageCID: string;
}

export default function UploadPage() {
	const [albumName, setAlbumName] = useState("");
	const [artistName, setArtistName] = useState("");
	const [albumImage, setAlbumImage] = useState<File | null>(null);
	const [uploadingAlbum, setUploadingAlbum] = useState(false);

	const [albums, setAlbums] = useState<Album[]>([]);
	const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");

	useEffect(() => {
		fetchAlbums();
	}, []);

	const fetchAlbums = async () => {
		try {
			const response = await fetch("http://localhost:42069/albums");
			if (response.ok) {
				const data = await response.json();
				setAlbums(data.items || []);
			}
		} catch (error) {
			console.log("Failed to fetch albums:", error);
		}
	};

	return (
		<div className="content-container">
			<CreateAlbumForm
				uploadingAlbum={uploadingAlbum}
				albumName={albumName}
				setAlbumName={setAlbumName}
				artistName={artistName}
				setArtistName={setArtistName}
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
