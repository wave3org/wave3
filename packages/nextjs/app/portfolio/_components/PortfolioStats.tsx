import { PortfolioStats as PortfolioStatsType } from "~~/services/portfolio/portfolioService";

interface PortfolioStatsProps {
	stats: PortfolioStatsType;
}

export const PortfolioStats = ({ stats }: PortfolioStatsProps) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
			{/* Valor total del portfolio */}
			<div className="bg-[#1a2f2f] rounded-lg p-6 border border-[#2d4444]">
				<div className="text-sm text-gray-400 mb-2">Valor total del portfolio</div>
				<div className="text-2xl font-bold text-white">
					{stats.totalValue.toFixed(2)} {stats.totalValueToken}
				</div>
				<div className={`text-sm mt-1 ${stats.totalValueChange >= 0 ? "text-[#4ade80]" : "text-red-400"}`}>
					{stats.totalValueChange >= 0 ? "+" : ""}
					{stats.totalValueChange}%
				</div>
			</div>

			{/* Rendimiento acumulado */}
			<div className="bg-[#1a2f2f] rounded-lg p-6 border border-[#2d4444]">
				<div className="text-sm text-gray-400 mb-2">Rendimiento acumulado</div>
				<div className="text-2xl font-bold text-white">+{stats.accumulatedYield}%</div>
			</div>

			{/* Canciones invertidas */}
			<div className="bg-[#1a2f2f] rounded-lg p-6 border border-[#2d4444]">
				<div className="text-sm text-gray-400 mb-2">Canciones invertidas</div>
				<div className="text-2xl font-bold text-white">{stats.songsInvested}</div>
			</div>

			{/* Regalías cobradas */}
			<div className="bg-[#1a2f2f] rounded-lg p-6 border border-[#2d4444]">
				<div className="text-sm text-gray-400 mb-2">Regalías cobradas</div>
				<div className="text-2xl font-bold text-white">
					{stats.royaltiesCollected.toFixed(2)} {stats.royaltiesToken}
				</div>
			</div>

			{/* Balance disponible */}
			<div className="bg-[#1a2f2f] rounded-lg p-6 border border-[#2d4444]">
				<div className="text-sm text-gray-400 mb-2">Balance disponible</div>
				<div className="text-2xl font-bold text-white">
					{stats.availableBalance.toFixed(2)} {stats.availableBalanceToken}
				</div>
			</div>
		</div>
	);
};
