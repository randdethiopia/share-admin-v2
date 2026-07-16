"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
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
	mapIndustrySectorsData,
} from "@/components/dashboard/chart-utils";

type Props = {
	industrySectors: AdminDashboardStats["industrySectors"];
};

export function IndustrySectorsBarChart({ industrySectors }: Props) {
	const theme = getChartTheme();
	const data = mapIndustrySectorsData(industrySectors);

	return (
		<ChartPanel
			title="Top industry sectors"
			subtitle="Grouped bar — business industries vs expert categories"
			legend={[
				<ChartLegendItem key="sme" color={LINE_COLORS.sme} label="Business" />,
				<ChartLegendItem key="advisor" color={LINE_COLORS.advisor} label="Expert" />,
			]}
		>
			{data.length === 0 ? (
				<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
					No industry data for the selected year
				</div>
			) : (
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ left: 0, right: 8 }}>
						<CartesianGrid stroke={theme.grid} vertical={false} />
						<XAxis
							dataKey="sector"
							tick={{ fill: theme.label, fontSize: 10 }}
							interval={0}
							angle={-20}
							textAnchor="end"
							height={50}
						/>
						<YAxis tick={{ fill: theme.label, fontSize: 11 }} />
						<Tooltip />
						<Bar dataKey="sme" name="Business" fill={LINE_COLORS.sme} radius={[4, 4, 0, 0]} />
						<Bar dataKey="advisor" name="Expert" fill={LINE_COLORS.advisor} radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			)}
		</ChartPanel>
	);
}
