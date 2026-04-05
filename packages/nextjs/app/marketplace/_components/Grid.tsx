"use client";

import { useState } from "react";
import Image from "next/image";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth";

interface GridProps {
	songIds: readonly bigint[];
}

const Grid = ({ ...props }: GridProps) => {
	const { data: songMetadataResponse, isLoading: isLoading } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getSongs",
		args: [props.songIds]
	});

	const { writeContractAsync: writeWavecoinAsync } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const [pendingSongId, setPendingSongId] = useState<bigint | null>(null);

	const handleBuyParts = async (songId: bigint, numberOfParts: bigint) => {
		try {
			setPendingSongId(songId);
			await writeWavecoinAsync({
				functionName: "buyParts",
				args: [songId, numberOfParts]
			});
		} catch (error) {
			console.error("❌ Error buying parts:", error);
			notification.error("Error buying parts");
		} finally {
			setPendingSongId(null);
		}
	};

	// TODO: SONG COMPONENT. BUY PARTS POPUP
	const renderSong = (songMetadata: SongMetadata) => {
		return (
			<div key={songMetadata.id}>
				<div className="song-card">
					<div className="song-thumbnail">
						<Image
							key={songMetadata.id}
							src={getFileUrl(songMetadata.album.imageCID)}
							width={230}
							height={230}
							alt={songMetadata.album.name}
						/>
					</div>
					<div className="song-info">
						<span className="song-title">{songMetadata.name}</span>
						<span className="song-artist">{songMetadata.album.artist}</span>
					</div>
					<div className="song-controls">
						<div className="w-full bg-base-300 rounded-full h-2">
							<div
								className="bg-primary h-2 rounded-full"
								style={{
									width: `${songMetadata.royaltiesDistribution.totalParts > 0 ? ((Number(songMetadata.royaltiesDistribution.totalParts) - Number(songMetadata.royaltiesDistribution.availableParts)) / Number(songMetadata.royaltiesDistribution.totalParts)) * 100 : 0}%`
								}}
							/>
						</div>
					</div>
					<div className="song-controls">
						<span className="text-xs text-base-content/60">
							{Number(songMetadata.royaltiesDistribution.totalParts) -
								Number(songMetadata.royaltiesDistribution.availableParts)}{" "}
							/ {songMetadata.royaltiesDistribution.totalParts.toString()} parts sold
						</span>
					</div>
					<div className="song-controls">
						<span className="text-sm font-semibold">{formatEther(songMetadata.partPrice)} WAVE / part</span>
					</div>
					{songMetadata.royaltiesDistribution.availableParts > 0 ? (
						<div>
							{pendingSongId === songMetadata.id ? (
								<span className="loading loading-spinner"></span>
							) : (
								<div className="song-controls">
									<button
										className="btn btn-primary btn-sm"
										onClick={() => handleBuyParts(songMetadata.id, BigInt(1))}
										disabled={pendingSongId !== null}
									>
										Buy 1 Part
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="song-controls">
							<span className="badge badge-neutral">Sold Out</span>
						</div>
					)}
				</div>
			</div>
		);
	};

	const renderSongs = () => {
		const songs = [];

		if (songMetadataResponse) {
			for (const songMetadata of songMetadataResponse.songs) {
				songs.push(renderSong(songMetadata));
			}
		}
		return <>{songs}</>;
	};

	return (
		<>
			{isLoading ? (
				<span className="loading loading-spinner"></span>
			) : (
				<>
					<div className="marketplace-container">{renderSongs()}</div>
				</>
			)}
		</>
	);
};

export default Grid;
