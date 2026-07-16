"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import type { AdminDashboardStats } from "@/lib/api/admin-dashboard";
import { ChartLegendItem, ChartPanel } from "@/components/dashboard/chart-panel";
import {
	getChartTheme,
	LINE_COLORS,
	mapSizeDistributionData,
} from "@/components/dashboard/chart-utils";

type Props = {
	sizeDistribution: AdminDashboardStats["sizeDistribution"];
};

export function SizeDistributionBarChart({ sizeDistribution }: Props) {
	const theme = getChartTheme();
	const data = mapSizeDistributionData(sizeDistribution);

	return (
		<ChartPanel
			title="Size & experience distribution"
			subtitle="Vertical bar — staff size and experience brackets"
			className="flex h-full flex-col"
			contentClassName="min-h-[280px] flex-1"
			legend={[
				<ChartLegendItem key="expert" color={LINE_COLORS.advisor} label="Expert experience" />,
				<ChartLegendItem key="business" color={LINE_COLORS.sme} label="Business staff size" />,
			]}
		>
			{data.length === 0 ? (
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					No size distribution data for the selected year
				</div>
			) : (
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ left: 0, right: 8, bottom: 24 }}>
						<CartesianGrid stroke={theme.grid} vertical={false} />
						<XAxis
							dataKey="bucket"
							tick={{ fill: theme.label, fontSize: 10 }}
							interval={0}
							angle={-15}
							textAnchor="end"
							height={48}
						/>
						<YAxis tick={{ fill: theme.label, fontSize: 11 }} />
						<Tooltip />
						<Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
							{data.map((entry, index) => (
								<Cell
									key={`${entry.profile}-${entry.bucket}-${index}`}
									fill={entry.profile === "Expert" ? LINE_COLORS.advisor : LINE_COLORS.sme}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			)}
		</ChartPanel>
	);
}
