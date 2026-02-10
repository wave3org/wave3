"use client";

import type { NextPage } from "next";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";

const DiscoverPage: NextPage = () => {
	const { data: songs } = useScaffoldReadContract({
		contractName: "Songs",
		functionName: "getAllSongs"
	});

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-4xl font-bold mb-2">Discover Songs</h1>
				<p className="text-gray-600">Browse all uploaded songs from the blockchain</p>
			</div>

			{!songs || songs.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-xl text-gray-500">No songs uploaded yet</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{songs.map(song => (
						<div key={song.id.toString()} className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
							<div className="mb-3">
								<h3 className="text-xl font-semibold mb-1">{song.name}</h3>
								<p className="text-sm text-gray-500">Song ID: {song.id.toString()}</p>
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
