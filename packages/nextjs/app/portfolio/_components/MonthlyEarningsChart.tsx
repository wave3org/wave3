"use client";

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatEther } from "viem";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface MonthlyEarningsChartProps {
	/** Keys are "YYYY-MM", values are wei amounts as strings */
	data: Record<string, string>;
}

export function MonthlyEarningsChart({ data }: MonthlyEarningsChartProps) {
	const labels = Object.keys(data).sort();
	const values = labels.map(k => Number(formatEther(BigInt(data[k]))));

	return (
		<Bar
			data={{
				labels,
				datasets: [
					{
						data: values,
						backgroundColor: "rgba(168, 85, 247, 0.7)",
						borderRadius: 6,
						borderSkipped: false
					}
				]
			}}
			options={{
				responsive: true,
				plugins: { legend: { display: false } },
				scales: {
					x: { grid: { display: false } },
					y: {
						grid: { color: "oklch(var(--bc) / 0.1)" },
						ticks: { callback: v => `${v} W` }
					}
				}
			}}
		/>
	);
}
