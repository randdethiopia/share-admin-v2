"use client";

import type { TraineeReportRegion } from "@/lib/api/trainee";
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

type CompletionByRegionChartProps = {
	regions: TraineeReportRegion[];
};

export function CompletionByRegionChart({ regions }: CompletionByRegionChartProps) {
	const data = [...regions]
		.sort((a, b) => b.total - a.total)
		.map((region) => ({
			region: region.region,
			completed: region.completed,
			inProgress: region.inProgress,
			accessedNotStarted: region.accessedNotStarted,
		}));

	const [completedDef, inProgressDef, accessedDef] = TRAINING_STATUS_DEFINITIONS;

	return (
		<ChartPanel
			title="Completion by region"
			legend={<ChartLegend items={LEGEND} />}
			chartHeightClassName="h-[280px]"
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 4, right: 8, left: 0, bottom: 48 }}
					role="img"
					aria-label="Grouped vertical bar chart showing completed, in-progress, and accessed-not-started participants per region"
				>
					<CartesianGrid vertical={false} className="stroke-border/40" />
					<XAxis
						dataKey="region"
						angle={-35}
						textAnchor="end"
						tick={{ fontSize: 10 }}
						interval={0}
						height={56}
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
