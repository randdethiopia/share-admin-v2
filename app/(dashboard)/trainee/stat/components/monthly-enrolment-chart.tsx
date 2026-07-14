"use client";

import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { CHART_COLORS } from "./chart-colors";
import { ChartLegend } from "./chart-legend";
import { ChartPanel } from "./chart-panel";

const DATA = [
	{ month: "Feb", enrolled: 14462, completed: 1637 },
	{ month: "Mar", enrolled: 14462, completed: 1637 },
	{ month: "Apr", enrolled: 16660, completed: 3500},
	{ month: "May", enrolled: 17255, completed: 11476 },
	{ month: "Jun", enrolled: 20823, completed: 27265 },
];

const LEGEND = [
	{ color: CHART_COLORS.blue, label: "Enrolled" },
	{ color: CHART_COLORS.success, label: "Completed" },
];

export function MonthlyEnrolmentChart() {
	return (
		<ChartPanel
			title="Monthly enrolment vs completions"
			legend={<ChartLegend items={LEGEND} />}
		>
			<ResponsiveContainer width="100%" height="100%">
				<ComposedChart
					data={DATA}
					margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
					role="img"
					aria-label="Line chart showing enrolled vs completed participants from January to June"
				>
					<CartesianGrid className="stroke-border/40" />
					<XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
					<YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
					<Tooltip />
					<Area
						type="monotone"
						dataKey="enrolled"
						fill={`${CHART_COLORS.blue}14`}
						stroke="none"
						name="Enrolled"
					/>
					<Area
						type="monotone"
						dataKey="completed"
						fill={`${CHART_COLORS.success}14`}
						stroke="none"
						name="Completed"
					/>
					<Line
						type="monotone"
						dataKey="enrolled"
						stroke={CHART_COLORS.blue}
						strokeWidth={2}
						dot={{ r: 4 }}
						name="Enrolled"
					/>
					<Line
						type="monotone"
						dataKey="completed"
						stroke={CHART_COLORS.success}
						strokeWidth={2}
						strokeDasharray="5 4"
						dot={{ r: 4 }}
						name="Completed"
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
