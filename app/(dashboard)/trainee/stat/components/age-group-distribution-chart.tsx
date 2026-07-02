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

import { CHART_COLORS } from "./chart-colors";
import { ChartLegend } from "./chart-legend";
import { ChartPanel } from "./chart-panel";

const DATA = [
	{
		status: "Completed",
		"18-25": 210,
		"26-35": 260,
		"36-45": 180,
		"46-55": 90,
		"55+": 46,
	},
	{
		status: "In progress",
		"18-25": 105,
		"26-35": 95,
		"36-45": 65,
		"46-55": 35,
		"55+": 12,
	},
	{
		status: "Not started",
		"18-25": 40,
		"26-35": 35,
		"36-45": 30,
		"46-55": 25,
		"55+": 20,
	},
];

const LEGEND = [
	{ color: CHART_COLORS.purple, label: "18–25" },
	{ color: CHART_COLORS.blue, label: "26–35" },
	{ color: CHART_COLORS.success, label: "36–45" },
	{ color: CHART_COLORS.warning, label: "46–55" },
	{ color: CHART_COLORS.muted, label: "55+" },
];

const AGE_GROUPS = [
	{ key: "18-25", fill: CHART_COLORS.purple, label: "18–25" },
	{ key: "26-35", fill: CHART_COLORS.blue, label: "26–35" },
	{ key: "36-45", fill: CHART_COLORS.success, label: "36–45" },
	{ key: "46-55", fill: CHART_COLORS.warning, label: "46–55" },
	{ key: "55+", fill: CHART_COLORS.muted, label: "55+" },
] as const;

export function AgeGroupDistributionChart() {
	return (
		<ChartPanel
			title="Age group distribution"
			subtitle="Stacked bar — age brackets across completion status"
			legend={<ChartLegend items={LEGEND} />}
			chartHeightClassName="h-[180px]"
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={DATA}
					margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
					role="img"
					aria-label="Stacked bar chart showing age group distribution across completed, in-progress, and not-started categories"
				>
					<CartesianGrid vertical={false} className="stroke-border/40" />
					<XAxis
						dataKey="status"
						tick={{ fontSize: 11 }}
						className="text-muted-foreground"
						axisLine={false}
						tickLine={false}
					/>
					<YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
					<Tooltip />
					{AGE_GROUPS.map((group) => (
						<Bar
							key={group.key}
							dataKey={group.key}
							stackId="age"
							fill={group.fill}
							name={group.label}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
