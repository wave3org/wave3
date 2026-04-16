"use client";

import { useState } from "react";
import BuyPartsModal from "./BuyPartsModal";
import ProgressBar from "./ProgressBar";
import { formatEther } from "viem";
import { SongCard } from "~~/components/SongCard";
import { getFileUrl } from "~~/services/files/fileService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";

interface GridProps {
	songsMetadata: SongMetadata[] | null;
	onChange: () => void;
}

const Grid = ({ ...props }: GridProps) => {
	const songsMetadata: SongMetadata[] | null = props.songsMetadata;
	const [selectedSong, setSelectedSong] = useState<SongMetadata | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const handleViewDetails = async (songMetadata: SongMetadata) => {
		setSelectedSong(songMetadata);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedSong(null);
	};

	const renderSong = (songMetadata: SongMetadata) => {
		return (
			<>
				<SongCard
					songId={String(songMetadata.id)}
					name={songMetadata.name}
					artist={songMetadata.album.artist}
					imageUrl={getFileUrl(songMetadata.album.imageCID)}
					actions={
						<>
							<div className="song-controls">
								<ProgressBar
									total={Number(songMetadata.royaltiesDistribution.totalParts)}
									progress={Number(
										songMetadata.royaltiesDistribution.totalParts - songMetadata.royaltiesDistribution.availableParts
									)}
								/>
							</div>
							<div className="song-controls">
								<span className="info">
									{Number(songMetadata.royaltiesDistribution.totalParts) -
										Number(songMetadata.royaltiesDistribution.availableParts)}{" "}
									/ {songMetadata.royaltiesDistribution.totalParts.toString()} parts sold
								</span>
							</div>
							<div className="song-controls">
								<span className="subtitle">{formatEther(songMetadata.partPrice)} WAVE / part</span>
							</div>
							{songMetadata.royaltiesDistribution.availableParts > 0 ? (
								<div className="song-controls">
									<button className="primary-button" onClick={() => handleViewDetails(songMetadata)}>
										View Details
									</button>
								</div>
							) : (
								<div className="song-controls">
									<span className="badge">Sold Out</span>
								</div>
							)}
						</>
					}
				/>
			</>
		);
	};

	const renderSongs = () => {
		const songs = [];

		if (songsMetadata) {
			for (const songMetadata of songsMetadata) {
				songs.push(
					<div className="song-container" key={songMetadata.id}>
						{renderSong(songMetadata)}
					</div>
				);
			}
		}
		return <>{songs}</>;
	};

	return (
		<>
			<div className="grid-container">{renderSongs()}</div>
			<BuyPartsModal
				songMetadata={selectedSong}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				onPartBought={props.onChange}
			/>
		</>
	);
};

export default Grid;
