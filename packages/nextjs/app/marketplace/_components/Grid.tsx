"use client";

import { useState } from "react";
import BuyPartsModal from "./BuyPartsModal";
import { formatEther } from "viem";
import { SongCard } from "~~/components/SongCard";
import { getFileUrl } from "~~/services/files/fileService";
import "~~/styles/home-page.css";
import "~~/styles/marketplace-page.css";
import { SongMetadata } from "~~/types/songMetadata";

interface GridProps {
	songsMetadata: SongMetadata[] | null;
	plays30dBySongId: Map<string, number>;
	onChange: () => void;
}

function calcReturnPerWave(songMetadata: SongMetadata, plays30d: number): number | null {
	const totalParts = Number(songMetadata.royaltiesDistribution.totalParts);
	const partPrice = Number(formatEther(songMetadata.partPrice));
	const playFee = Number(formatEther(songMetadata.playFee));
	if (totalParts === 0 || partPrice === 0) return null;
	return (plays30d * playFee) / (totalParts * partPrice);
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
		const plays30d = props.plays30dBySongId.get(songMetadata.id.toString()) ?? 0;
		const returnPerWave = calcReturnPerWave(songMetadata, plays30d);
		return (
			<>
				<SongCard
					songId={String(songMetadata.id)}
					name={songMetadata.name}
					artist={songMetadata.album.artist}
					imageUrl={getFileUrl(songMetadata.album.imageCID)}
					actions={
						<div className="flex flex-col gap-1.5 pt-1">
							<div className="flex items-start justify-between gap-1">
								<div className="flex flex-col">
									<span className="text-[10px] uppercase tracking-wide text-base-content/40">Return · 30d</span>
									{returnPerWave !== null && returnPerWave > 0 ? (
										<span className="text-success font-semibold text-xs">~{returnPerWave.toFixed(2)} WAVE / WAVE</span>
									) : (
										<span className="text-base-content/35 text-xs">No activity</span>
									)}
								</div>
								<div className="flex flex-col items-end shrink-0">
									<span className="text-[10px] uppercase tracking-wide text-base-content/40">Cost / part</span>
									<span className="text-xs text-base-content/70 font-medium">
										{formatEther(songMetadata.partPrice)} WAVE
									</span>
								</div>
							</div>
							{songMetadata.royaltiesDistribution.availableParts > 0 ? (
								<button className="primary-button w-full" onClick={() => handleViewDetails(songMetadata)}>
									View Details
								</button>
							) : (
								<span className="badge w-full justify-center">Sold Out</span>
							)}
						</div>
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
