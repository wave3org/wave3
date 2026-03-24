"use client";

import Image from "next/image";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth";

interface GridProps {
	songIds: number[];
}

const Grid = ({ ...props }: GridProps) => {
	const { data: songMetadataResponse, isLoading: isLoading } = useScaffoldReadContract({
		contractName: "SongsPresenter",
		functionName: "getSongs",
		args: [props.songIds]
	});

	const { writeContractAsync: writeWavecoinAsync, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});

	const handleBuyParts = async (songId: bigint, numberOfParts: bigint) => {
		try {
			await writeWavecoinAsync({
				functionName: "buyParts",
				args: [songId, numberOfParts]
			});
		} catch (error) {
			console.error("❌ Error buying parts:", error);
			notification.error("Error buying parts");
		}
	};

	// TODO: SONG COMPONENT. BUY PARTS POPUP
	const renderSong = (songMetadata: SongMetadata) => {
		return (
			<div className="marketplace-song-container" key={songMetadata.id}>
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
						<span>PROGRESS BAR</span>
					</div>
					<div className="song-controls">
						<span>Total parts: {songMetadata.royaltiesDistribution.totalParts}</span>
					</div>
					<div className="song-controls">
						<span>Available parts: {songMetadata.royaltiesDistribution.availableParts}</span>
					</div>
					<div className="song-controls">
						<span>Part price: {formatEther(songMetadata.partPrice)}</span>
					</div>
					{songMetadata.royaltiesDistribution.availableParts > 0 ? (
						<div>
							{isPending ? (
								<span className="loading loading-spinner"></span>
							) : (
								<div className="song-controls">
									<button
										className="primary-button"
										onClick={() => handleBuyParts(songMetadata.id, BigInt(1))}
										disabled={isPending}
									>
										<span>BUY PARTS</span>
									</button>
								</div>
							)}
						</div>
					) : (
						<div className="song-controls">
							<span>SOLD OUT</span>
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
