import { PortfolioStats as PortfolioStatsType } from "~~/services/portfolio/portfolioService";

interface PortfolioStatsProps {
	stats: PortfolioStatsType;
}

export const PortfolioStats = ({ stats }: PortfolioStatsProps) => {
	return (
		<div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Total Invested</div>
				<div className="text-2xl font-bold">
					{stats.totalTokensInvested.toFixed(2)} {stats.tokenSymbol}
				</div>
			</div>

			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Songs Invested</div>
				<div className="text-2xl font-bold">{stats.songsInvested}</div>
			</div>

			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Parts Owned</div>
				<div className="text-2xl font-bold">{stats.totalPartsOwned}</div>
			</div>

			<div className="bg-base-100 rounded-lg p-6 border border-base-300">
				<div className="text-sm text-base-content/60 mb-2">Total Song Plays</div>
				<div className="text-2xl font-bold">{stats.totalPlays}</div>
			</div>
		</div>
	);
};
