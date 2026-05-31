import { SetStateAction, useState } from "react";
import { formatEther } from "viem";
import { SongCard } from "~~/components/SongCard";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getFileUrl } from "~~/services/files/fileService";
import { SongMetadata } from "~~/types/songMetadata";
import { notification } from "~~/utils/scaffold-eth";

interface BuyPartsModalProps {
	songMetadata: SongMetadata | null;
	isOpen: boolean;
	onClose: () => void;
	onPartBought: () => void;
}

const BuyPartsModal = ({ ...props }: BuyPartsModalProps) => {
	const songMetadata: SongMetadata | null = props.songMetadata;
	const [numberOfParts, setNumberOfParts] = useState("1");
	const { writeContractAsync: writeWavecoinAsync, isPending } = useScaffoldWriteContract({
		contractName: "Wavecoin"
	});
	const handleBuyParts = async (songId: bigint) => {
		try {
			await writeWavecoinAsync({
				functionName: "buyParts",
				args: [songId, BigInt(numberOfParts)]
			});
			props.onPartBought();
			props.onClose();
		} catch (error) {
			console.error("Error buying parts:", error);
			notification.error("Error buying parts");
		}
	};

	if (!props.isOpen || !props.songMetadata) return null;

	const renderContent = () => {
		if (songMetadata) {
			const sold: bigint =
				songMetadata.royaltiesDistribution.totalParts - songMetadata.royaltiesDistribution.availableParts;

			return (
				<div className="modal-main-container">
					<div className="modal-backdrop" onClick={props.onClose}></div>

					<div className="modal-container">
						<div className="modal-header">
							<button className="close-button" onClick={props.onClose}>
								✕
							</button>
						</div>
						<div className="modal-content">
							<SongCard
								songId={String(songMetadata.id)}
								name={songMetadata.name}
								artist={songMetadata.album.artist}
								imageUrl={getFileUrl(songMetadata.album.imageCID)}
								actions={<></>}
							/>
							<div className="modal-info-container">
								<div className="modal-info-content">
									<span className="subtitle">Availability</span>
									<span className="info">Available: {songMetadata.royaltiesDistribution.availableParts} parts</span>
									<span className="info">Sold: {sold} parts</span>
								</div>
								<div className="modal-info-content">
									<span className="subtitle">Price: {formatEther(songMetadata.buyPrice)} WAVE / part</span>
									<div className="modal-purchase-form">
										<input
											id="parts"
											className="input-secondary"
											type="number"
											min={1}
											max={String(songMetadata.royaltiesDistribution.availableParts)}
											value={numberOfParts}
											onChange={(e: { target: { value: SetStateAction<string> } }) => setNumberOfParts(e.target.value)}
											placeholder="1"
											disabled={isPending}
										/>
										<button
											className="secondary-button"
											disabled={isPending}
											onClick={() => handleBuyParts(songMetadata.id)}
										>
											Buy Parts
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		} else {
			return <></>;
		}
	};

	return renderContent();
};

export default BuyPartsModal;
