"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { CHART_COLORS } from "./chart-colors";
import { ChartLegend } from "./chart-legend";
import { ChartPanel } from "./chart-panel";

const RATES = [91, 78, 65, 82, 45, 88, 70, 55, 93, 68];
const COURSE_LABELS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10"];

const DATA = COURSE_LABELS.map((course, index) => ({
	course,
	rate: RATES[index],
}));

const LEGEND = [
	{ color: CHART_COLORS.success, label: "≥ 70% — on target" },
	{ color: CHART_COLORS.danger, label: "< 70% — needs attention" },
];

export function CompletionRatePerCourseChart() {
	return (
		<ChartPanel
			title="Completion rate per course"
			legend={<ChartLegend items={LEGEND} />}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={DATA}
					margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
					role="img"
					aria-label="Vertical bar chart showing completion rate percentage per course, with threshold at 70%"
				>
					<CartesianGrid vertical={false} className="stroke-border/40" />
					<XAxis
						dataKey="course"
						tick={{ fontSize: 11 }}
						className="text-muted-foreground"
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						domain={[0, 100]}
						tick={{ fontSize: 11 }}
						className="text-muted-foreground"
						tickFormatter={(value) => `${value}%`}
					/>
					<Tooltip formatter={(value: number) => [`${value}%`, "Completion"]} />
					<ReferenceLine
						y={70}
						stroke={CHART_COLORS.warning}
						strokeWidth={1.5}
						strokeDasharray="4 4"
					/>
					<Bar dataKey="rate" name="Completion %">
						{DATA.map((entry) => (
							<Cell
								key={entry.course}
								fill={entry.rate >= 70 ? CHART_COLORS.success : CHART_COLORS.danger}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
