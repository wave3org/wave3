import { SongParticipation } from "~~/services/portfolio/portfolioService";

interface SongParticipationTableProps {
	participations: SongParticipation[];
	onViewDetails: (participation: SongParticipation) => void;
}

export const SongParticipationTable = ({ participations, onViewDetails }: SongParticipationTableProps) => {
	return (
		<div className="bg-base-100 rounded-lg border border-base-300">
			<div className="p-6">
				<h2 className="text-2xl font-bold mb-6">Participaciones en Canciones</h2>

				<div className="overflow-x-auto">
					<table className="table w-full">
						<thead>
							<tr className="border-b border-base-300">
								<th className="text-left text-sm font-medium text-neutral">Canción</th>
								<th className="text-left text-sm font-medium text-neutral">Participación</th>
								<th className="text-left text-sm font-medium text-neutral">Rentabilidad</th>
								<th className="text-right text-sm font-medium text-neutral">Acciones</th>
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
										<div>{participation.participationPercent}%</div>
									</td>
									<td className="py-4">
										<div
											className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
												participation.profitability >= 0 ? "bg-success/20 text-success" : "bg-error/20 text-error"
											}`}
										>
											{participation.profitability >= 0 ? "+" : ""}
											{participation.profitability}%
										</div>
									</td>
									<td className="py-4 text-right">
										<button onClick={() => onViewDetails(participation)} className="btn btn-primary btn-sm">
											Ver detalle
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};
