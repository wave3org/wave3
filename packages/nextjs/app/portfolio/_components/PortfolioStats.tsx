import { PortfolioStats as PortfolioStatsType } from "~~/services/portfolio/portfolioService";

interface PortfolioStatsProps {
	stats: PortfolioStatsType;
}

export const PortfolioStats = ({ stats }: PortfolioStatsProps) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
			{/* Total portfolio value */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Total Portfolio Value</div>
				<div className="text-2xl font-bold">
					{stats.totalValue.toFixed(2)} {stats.totalValueToken}
				</div>
				<div className={`text-sm mt-1 ${stats.totalValueChange >= 0 ? "text-success" : "text-error"}`}>
					{stats.totalValueChange >= 0 ? "+" : ""}
					{stats.totalValueChange}%
				</div>
			</div>

			{/* Accumulated yield */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Accumulated Yield</div>
				<div className="text-2xl font-bold">+{stats.accumulatedYield}%</div>
			</div>

			{/* Songs invested */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Songs Invested</div>
				<div className="text-2xl font-bold">{stats.songsInvested}</div>
			</div>

			{/* Royalties collected */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Royalties Collected</div>
				<div className="text-2xl font-bold">
					{stats.royaltiesCollected.toFixed(2)} {stats.royaltiesToken}
				</div>
			</div>

			{/* Available balance */}
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Available Balance</div>
				<div className="text-2xl font-bold">
					{stats.availableBalance.toFixed(2)} {stats.availableBalanceToken}
				</div>
			</div>
		</div>
	);
};
