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
	{ region: "North", completed: 180, inProgress: 65, pending: 20 },
	{ region: "South", completed: 145, inProgress: 80, pending: 35 },
	{ region: "East", completed: 210, inProgress: 55, pending: 15 },
	{ region: "West", completed: 95, inProgress: 40, pending: 18 },
	{ region: "Central", completed: 156, inProgress: 72, pending: 27 },
];

const LEGEND = [
	{ color: CHART_COLORS.success, label: "Completed" },
	{ color: CHART_COLORS.warning, label: "In progress" },
	{ color: CHART_COLORS.danger, label: "Pending" },
];

export function CompletionByRegionChart() {
	return (
		<ChartPanel
			title="Completion by region"
			subtitle="Horizontal bar — participants per region"
			legend={<ChartLegend items={LEGEND} />}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					layout="vertical"
					data={DATA}
					margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
					role="img"
					aria-label="Stacked horizontal bar chart showing completed, in-progress, and pending participants per region"
				>
					<CartesianGrid horizontal={false} className="stroke-border/40" />
					<XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
					<YAxis
						type="category"
						dataKey="region"
						width={56}
						tick={{ fontSize: 11 }}
						className="text-muted-foreground"
						axisLine={false}
						tickLine={false}
					/>
					<Tooltip />
					<Bar dataKey="completed" stackId="status" fill={CHART_COLORS.success} name="Completed" />
					<Bar dataKey="inProgress" stackId="status" fill={CHART_COLORS.warning} name="In progress" />
					<Bar dataKey="pending" stackId="status" fill={CHART_COLORS.danger} name="Pending" />
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
