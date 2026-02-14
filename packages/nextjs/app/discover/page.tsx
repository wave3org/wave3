"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { getFileUrl } from "~~/services/files/fileService";
import { type SongFromPonder, fetchSongsFromPonder } from "~~/services/songs/ponderSongService";

const DiscoverPage: NextPage = () => {
	const [songs, setSongs] = useState<SongFromPonder[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const loadSongs = async () => {
			setLoading(true);
			const fetchedSongs = await fetchSongsFromPonder(searchQuery || undefined);
			setSongs(fetchedSongs);
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
				<h1 className="text-4xl font-bold mb-2">Discover Songs</h1>
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
							key={song.transactionHash}
							className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
						>
							<div className="mb-3">
								<h3 className="text-xl font-semibold mb-1">{song.name}</h3>
								<p className="text-sm text-gray-500">Song ID: {song.songId}</p>
							</div>
							<audio controls className="w-full">
								<source src={getFileUrl(song.audioCID)} type="audio/mpeg" />
								Your browser does not support the audio element.
							</audio>
							<div className="mt-3 text-xs text-gray-400 break-all">
								<span className="font-mono">CID: {song.audioCID}</span>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default DiscoverPage;
