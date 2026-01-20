import { SongParticipation } from "~~/services/portfolio/portfolioService";

interface SongParticipationTableProps {
	participations: SongParticipation[];
	onViewDetails: (participation: SongParticipation) => void;
}

export const SongParticipationTable = ({ participations, onViewDetails }: SongParticipationTableProps) => {
	return (
		<div className="bg-[#1a2f2f] rounded-lg border border-[#2d4444]">
			<div className="p-6">
				<h2 className="text-2xl font-bold text-white mb-6">Participaciones en Canciones</h2>

				<div className="overflow-x-auto">
					<table className="table w-full">
						<thead>
							<tr className="border-b border-[#2d4444]">
								<th className="text-left text-sm font-medium text-gray-400">Canción</th>
								<th className="text-left text-sm font-medium text-gray-400">Participación</th>
								<th className="text-left text-sm font-medium text-gray-400">Rentabilidad</th>
								<th className="text-right text-sm font-medium text-gray-400">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{participations.map(participation => (
								<tr key={participation.id} className="border-b border-[#2d4444] hover:bg-[#234040]">
									<td className="py-4">
										<div className="font-medium text-white">
											{participation.songTitle} - {participation.artist}
										</div>
									</td>
									<td className="py-4">
										<div className="text-white">{participation.participationPercent}%</div>
									</td>
									<td className="py-4">
										<div
											className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
												participation.profitability >= 0 ? "bg-[#1a3d3d] text-[#4ade80]" : "bg-[#3d1a1a] text-[#f87171]"
											}`}
										>
											{participation.profitability >= 0 ? "+" : ""}
											{participation.profitability}%
										</div>
									</td>
									<td className="py-4 text-right">
										<button
											onClick={() => onViewDetails(participation)}
											className="px-4 py-2 rounded-lg bg-[#234040] text-white hover:bg-[#2d4d4d] transition-colors text-sm font-medium"
										>
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
