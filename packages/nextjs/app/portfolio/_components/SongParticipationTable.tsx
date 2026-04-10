import { SongParticipation } from "~~/services/portfolio/portfolioService";

interface SongParticipationTableProps {
	participations: SongParticipation[];
	onViewDetails: (participation: SongParticipation) => void;
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
								<th className="text-right text-sm font-medium text-base-content/60">Actions</th>
							</tr>
						</thead>
						<tbody>
							{participations.map(participation => (
								<tr key={participation.id} className="border-b border-base-300 hover:bg-base-200">
									<td className="py-4">
										<div className="font-medium">
											{participation.songTitle} - {participation.artist}
										</div>
									</td>
									<td className="py-4">
										<div>{participation.partsOwned}</div>
									</td>
									<td className="py-4">
										<div>{participation.participationPercent}%</div>
									</td>
									<td className="py-4">
										<div>{participation.plays}</div>
									</td>
									<td className="py-4 text-right">
										<button onClick={() => onViewDetails(participation)} className="btn btn-primary btn-sm">
											View Details
										</button>
									</td>
								</tr>
							))}
							{participations.length === 0 && (
								<tr>
									<td colSpan={5} className="py-10 text-center text-base-content/60">
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
