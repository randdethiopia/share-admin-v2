"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CHART_COLORS } from "./chart-colors";
import { ChartLegend } from "./chart-legend";
import { ChartPanel } from "./chart-panel";

const DATA = [
	{ name: "Completed", value: 63, fill: CHART_COLORS.success },
	{ name: "In progress", value: 25, fill: CHART_COLORS.warning },
	{ name: "Not started", value: 8, fill: CHART_COLORS.danger },
	{ name: "Dropped", value: 4, fill: CHART_COLORS.muted },
] as const;

const LEGEND = [
	{ color: CHART_COLORS.success, label: "Completed 63%" },
	{ color: CHART_COLORS.warning, label: "In progress 25%" },
	{ color: CHART_COLORS.danger, label: "Not started 8%" },
	{ color: CHART_COLORS.muted, label: "Dropped 4%" },
];

export function CourseCompletionDonutChart() {
	return (
		<ChartPanel
			title="Course completion status"
			subtitle="Donut chart — proportion by status"
			legend={<ChartLegend items={[...LEGEND]} />}
		>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart
					role="img"
					aria-label="Donut chart: 63% completed, 25% in progress, 8% not started, 4% dropped"
				>
					<Tooltip formatter={(value: number, name: string) => [`${value}%`, name]} />
					<Pie
						data={[...DATA]}
						dataKey="value"
						nameKey="name"
						innerRadius="65%"
						outerRadius="100%"
						strokeWidth={2}
						stroke="hsl(var(--background))"
					>
						{DATA.map((entry) => (
							<Cell key={entry.name} fill={entry.fill} />
						))}
					</Pie>
				</PieChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
