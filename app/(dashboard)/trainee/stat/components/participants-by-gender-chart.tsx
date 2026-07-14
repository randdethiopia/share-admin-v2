"use client";

import type { TraineeReportGender } from "@/lib/api/trainee";
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

function formatGenderLabel(gender: string) {
	return gender.charAt(0).toUpperCase() + gender.slice(1);
}

type ParticipantsByGenderChartProps = {
	gender: TraineeReportGender[];
};

export function ParticipantsByGenderChart({ gender }: ParticipantsByGenderChartProps) {
	const data = [...gender]
		.sort((a, b) => b.total - a.total)
		.map((entry) => ({
			gender: formatGenderLabel(entry.gender),
			completed: entry.completed,
			inProgress: entry.inProgress,
			accessedNotStarted: entry.accessedNotStarted,
		}));

	const [completedDef, inProgressDef, accessedDef] = TRAINING_STATUS_DEFINITIONS;

	return (
		<ChartPanel
			title="Participants by gender"
			legend={<ChartLegend items={LEGEND} />}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
					role="img"
					aria-label="Grouped bar chart showing completed, in-progress, and accessed-not-started participants by gender"
				>
					<CartesianGrid vertical={false} className="stroke-border/40" />
					<XAxis
						dataKey="gender"
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
