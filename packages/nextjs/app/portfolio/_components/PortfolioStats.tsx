import { PortfolioStats as PortfolioStatsType } from "~~/services/portfolio/portfolioService";

interface PortfolioStatsProps {
	stats: PortfolioStatsType;
}

export const PortfolioStats = ({ stats }: PortfolioStatsProps) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
			{/* Valor total del portfolio */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-neutral mb-2">Valor total del portfolio</div>
				<div className="text-2xl font-bold">
					{stats.totalValue.toFixed(2)} {stats.totalValueToken}
				</div>
				<div className={`text-sm mt-1 ${stats.totalValueChange >= 0 ? "text-success" : "text-error"}`}>
					{stats.totalValueChange >= 0 ? "+" : ""}
					{stats.totalValueChange}%
				</div>
			</div>

			{/* Rendimiento acumulado */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-neutral mb-2">Rendimiento acumulado</div>
				<div className="text-2xl font-bold">+{stats.accumulatedYield}%</div>
			</div>

			{/* Canciones invertidas */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-neutral mb-2">Canciones invertidas</div>
				<div className="text-2xl font-bold">{stats.songsInvested}</div>
			</div>

			{/* Regalías cobradas */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-neutral mb-2">Regalías cobradas</div>
				<div className="text-2xl font-bold">
					{stats.royaltiesCollected.toFixed(2)} {stats.royaltiesToken}
				</div>
			</div>

			{/* Balance disponible */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-neutral mb-2">Balance disponible</div>
				<div className="text-2xl font-bold">
					{stats.availableBalance.toFixed(2)} {stats.availableBalanceToken}
				</div>
			</div>
		</div>
	);
};
