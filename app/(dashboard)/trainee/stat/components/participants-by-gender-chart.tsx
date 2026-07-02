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
	{ course: "Course A", female: 120, male: 100 },
	{ course: "Course B", female: 95, male: 80 },
	{ course: "Course C", female: 140, male: 95 },
	{ course: "Course D", female: 80, male: 70 },
	{ course: "Course E", female: 110, male: 90 },
];

const LEGEND = [
	{ color: CHART_COLORS.purple, label: "Female" },
	{ color: CHART_COLORS.blue, label: "Male" },
];

export function ParticipantsByGenderChart() {
	return (
		<ChartPanel
			title="Participants by gender"
			subtitle="Bar chart — demographic breakdown"
			legend={<ChartLegend items={LEGEND} />}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={DATA}
					margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
					role="img"
					aria-label="Grouped bar chart showing female and male participants across five courses"
				>
					<CartesianGrid vertical={false} className="stroke-border/40" />
					<XAxis
						dataKey="course"
						tick={{ fontSize: 11 }}
						className="text-muted-foreground"
						axisLine={false}
						tickLine={false}
					/>
					<YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
					<Tooltip />
					<Bar dataKey="female" fill={CHART_COLORS.purple} name="Female" />
					<Bar dataKey="male" fill={CHART_COLORS.blue} name="Male" />
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
