import Image from "next/image";
import { SongParticipation } from "../../../services/portfolio/portfolioService";

interface SongDetailModalProps {
	participation: SongParticipation | null;
	isOpen: boolean;
	onClose: () => void;
}

export const SongDetailModal = ({ participation, isOpen, onClose }: SongDetailModalProps) => {
	if (!isOpen || !participation) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/70" onClick={onClose}></div>

			<div className="relative bg-base-100 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
				<div className="flex flex-col md:flex-row">
					<div className="md:w-2/5 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-8 flex items-center justify-center">
						<div className="relative w-full aspect-square max-w-xs">
							<Image
								src={participation.imageUrl}
								alt={participation.songTitle}
								fill
								className="rounded-lg object-cover"
							/>
						</div>
					</div>

					<div className="md:w-3/5 p-8 bg-base-100">
						<button
							onClick={onClose}
							className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-base-200 transition-colors"
						>
							✕
						</button>

						<h2 className="text-3xl font-bold mb-1">{participation.songTitle}</h2>
						<p className="text-lg text-base-content/60 mb-6">{participation.artist}</p>

						<div className="grid grid-cols-2 gap-4 mb-6">
							<div>
								<div className="text-sm text-base-content/60">Purchase Date</div>
								<div className="text-base font-medium">{participation.purchaseDate}</div>
							</div>
							<div>
								<div className="text-sm text-base-content/60">Part Price</div>
								<div className="text-base font-medium">
									{participation.partPrice.toFixed(2)} {participation.investedToken}
								</div>
							</div>
							<div>
								<div className="text-sm text-base-content/60">Parts Owned</div>
								<div className="text-base font-medium">{participation.partsOwned}</div>
							</div>
							<div>
								<div className="text-sm text-base-content/60">Total Invested</div>
								<div className="text-base font-medium">
									{participation.tokensInvested.toFixed(2)} {participation.investedToken}
								</div>
							</div>
						</div>

						<div className="mb-6">
							<div className="text-sm text-base-content/60">My Participation</div>
							<div className="text-2xl font-bold text-primary">{participation.participationPercent}%</div>
						</div>

						<div className="mb-6">
							<div className="text-sm text-base-content/60 mb-2">Song Performance</div>
							<div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
								{participation.plays} plays registered
							</div>
						</div>

						<div className="flex gap-3">
							<button className="btn btn-primary flex-1" disabled>
								Sell Participation (Soon)
							</button>
							<button className="btn btn-outline flex-1" disabled>
								Withdraw Royalties (Soon)
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
