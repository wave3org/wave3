import { PortfolioStats as PortfolioStatsType } from "../../../services/portfolio/portfolioService";

interface PortfolioStatsProps {
	stats: PortfolioStatsType;
}

export const PortfolioStats = ({ stats }: PortfolioStatsProps) => {
	return (
		<div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
			<div className="bg-base-100 rounded-lg p-4 border border-base-300">
				<div className="text-xs text-base-content/60 mb-1">Total Invested</div>
				<div className="text-xl font-bold">
					{stats.totalTokensInvested.toFixed(2)} {stats.tokenSymbol}
				</div>
			</div>

			<div className="bg-base-100 rounded-lg p-4 border border-base-300">
				<div className="text-xs text-base-content/60 mb-1">Songs Invested</div>
				<div className="text-xl font-bold">{stats.songsInvested}</div>
			</div>

			<div className="bg-base-100 rounded-lg p-4 border border-base-300">
				<div className="text-xs text-base-content/60 mb-1">Parts Owned</div>
				<div className="text-xl font-bold">{stats.totalPartsOwned}</div>
			</div>

			<div className="bg-base-100 rounded-lg p-4 border border-base-300">
				<div className="text-xs text-base-content/60 mb-1">Total Song Plays</div>
				<div className="text-xl font-bold">{stats.totalPlays}</div>
			</div>
		</div>
	);
};
