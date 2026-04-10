"use client";

import { useState } from "react";
import CreateAlbumForm from "./_components/CreateAlbumForm";

export default function UploadPage() {
	const [albumName, setAlbumName] = useState("");
	const [artistName, setArtistName] = useState("");
	const [genre, setGenre] = useState("");
	const [year, setYear] = useState("");
	const [albumImage, setAlbumImage] = useState<File | null>(null);
	const [uploadingAlbum, setUploadingAlbum] = useState(false);

	return (
		<div className="container mx-auto px-4 pb-12 pt-8 md:pt-10">
			<div className="mb-8 rounded-3xl border border-base-300/60 bg-gradient-to-br from-amber-100 via-base-100 to-cyan-100 p-6 shadow-xl md:p-10">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-base-content/60">Wave3 Studio</p>
				<h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight text-base-content md:text-5xl">
					Share your next release with your community
				</h1>
				<p className="mt-4 max-w-3xl text-sm text-base-content/70 md:text-base">
					Create your album, upload the cover, and add every song in one go. Give listeners a complete experience from
					day one.
				</p>
			</div>

			<div className="w-full">
				<CreateAlbumForm
					uploadingAlbum={uploadingAlbum}
					albumName={albumName}
					setAlbumName={setAlbumName}
					artistName={artistName}
					setArtistName={setArtistName}
					genre={genre}
					setGenre={setGenre}
					year={year}
					setYear={setYear}
					albumImage={albumImage}
					setAlbumImage={setAlbumImage}
					setUploadingAlbum={setUploadingAlbum}
					onAlbumCreated={() => undefined}
				/>
			</div>
		</div>
	);
}
