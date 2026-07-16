"use client";

import type { TraineeReportAgeGroup } from "@/lib/api/trainee";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { ChartLegend } from "./chart-legend";
import { ChartPanel } from "./chart-panel";
import { TRAINING_STATUS_DEFINITIONS } from "./training-status-definitions";

const LEGEND = TRAINING_STATUS_DEFINITIONS.map((item) => ({
	color: item.color,
	label: item.shortLabel,
}));

type AgeGroupDistributionChartProps = {
	ageGroups: TraineeReportAgeGroup[];
};

export function AgeGroupDistributionChart({ ageGroups }: AgeGroupDistributionChartProps) {
	const data = ageGroups.map((group) => ({
		ageGroup: group.ageGroup,
		completed: group.completed,
		inProgress: group.inProgress,
		accessedNotStarted: group.accessedNotStarted,
	}));

	const [completedDef, inProgressDef, accessedDef] = TRAINING_STATUS_DEFINITIONS;

	return (
		<ChartPanel
			title="Age group distribution"
			legend={<ChartLegend items={LEGEND} />}
			chartHeightClassName="h-[180px]"
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
					role="img"
					aria-label="Grouped bar chart showing completed, in-progress, and accessed-not-started participants by age group"
				>
					<CartesianGrid vertical={false} className="stroke-border/40" />
					<XAxis
						dataKey="ageGroup"
						tick={{ fontSize: 11 }}
						className="text-muted-foreground"
						axisLine={false}
						tickLine={false}
					/>
					<YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
					<Tooltip />
					<Bar
						dataKey="completed"
						fill={completedDef.color}
						name={completedDef.shortLabel}
					/>
					<Bar
						dataKey="inProgress"
						fill={inProgressDef.color}
						name={inProgressDef.shortLabel}
					/>
					<Bar
						dataKey="accessedNotStarted"
						fill={accessedDef.color}
						name={accessedDef.shortLabel}
					/>
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
