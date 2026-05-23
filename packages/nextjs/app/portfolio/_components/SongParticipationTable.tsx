import Image from "next/image";
import { SongParticipation } from "../../../services/portfolio/portfolioService";

interface SongParticipationTableProps {
	participations: SongParticipation[];
	onViewDetails: (participation: SongParticipation) => void;
}

function calcRoyalties30d(p: SongParticipation): number {
	return p.playsInPeriod * p.playFeeWave * (p.participationPercent / 100);
}

export const SongParticipationTable = ({ participations, onViewDetails }: SongParticipationTableProps) => {
	return (
		<div className="bg-base-100 rounded-lg border border-base-300">
			<div className="p-6">
				<h2 className="text-2xl font-bold mb-6">Royalty Positions</h2>

				<div className="overflow-x-auto">
					<table className="table w-full">
						<thead>
							<tr className="border-b border-base-300">
								<th className="text-left text-sm font-medium text-base-content/60">Song</th>
								<th className="text-left text-sm font-medium text-base-content/60">Parts Owned</th>
								<th className="text-left text-sm font-medium text-base-content/60">Participation</th>
								<th className="text-left text-sm font-medium text-base-content/60">Plays</th>
								<th className="text-left text-sm font-medium text-base-content/60">
									Royalties {participations[0]?.periodDays ?? 30}d
								</th>
								<th className="text-right text-sm font-medium text-base-content/60">Actions</th>
							</tr>
						</thead>
						<tbody>
							{participations.map(participation => {
								const royalties30d = calcRoyalties30d(participation);
								return (
									<tr key={participation.id} className="border-b border-base-300 hover:bg-base-200">
										<td className="py-4">
											<div className="flex items-center gap-2">
												{participation.imageUrl && (
													<Image
														src={participation.imageUrl}
														alt={participation.songTitle}
														width={32}
														height={32}
														className="rounded object-cover shrink-0"
													/>
												)}
												<span className="font-medium">
													{participation.songTitle} - {participation.artist}
												</span>
											</div>
										</td>
										<td className="py-4">
											<div>{participation.partsOwned}</div>
										</td>
										<td className="py-4">
											<div>{participation.participationPercent.toFixed(1)}%</div>
										</td>
										<td className="py-4">
											<div>{participation.plays}</div>
										</td>
										<td className="py-4">
											{royalties30d > 0 ? (
												<span className="font-semibold text-success">+{royalties30d.toFixed(4)} WAVE</span>
											) : (
												<span className="text-base-content/40 text-sm">—</span>
											)}
										</td>
										<td className="py-4 text-right">
											<button onClick={() => onViewDetails(participation)} className="btn btn-primary btn-sm">
												View Details
											</button>
										</td>
									</tr>
								);
							})}
							{participations.length === 0 && (
								<tr>
									<td colSpan={6} className="py-10 text-center text-base-content/60">
										No royalty positions found yet.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
