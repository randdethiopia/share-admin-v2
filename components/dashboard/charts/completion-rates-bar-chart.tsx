"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	LabelList,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import type { AdminDashboardStats } from "@/lib/api/admin-dashboard";
import { ChartLegendItem, ChartPanel } from "@/components/dashboard/chart-panel";
import {
	COMPLETION_THRESHOLD,
	getChartTheme,
	mapCompletionRatesData,
	STATUS_COLORS,
} from "@/components/dashboard/chart-utils";

type Props = {
	completionRates: AdminDashboardStats["completionRates"];
};

const AXIS_TICK_FILL = "#737373";

function PercentYTick({
	x,
	y,
	payload,
}: {
	x?: number;
	y?: number;
	payload?: { value: number };
}) {
	if (x == null || y == null || payload == null) return null;

	return (
		<text
			x={x}
			y={y}
			dy={4}
			textAnchor="end"
			fill={AXIS_TICK_FILL}
			fontSize={12}
			fontWeight={500}
		>
			{`${payload.value}%`}
		</text>
	);
}

export function CompletionRatesBarChart({ completionRates }: Props) {
	const theme = getChartTheme();
	const data = mapCompletionRatesData(completionRates);

	return (
		<ChartPanel
			title="Profile completion rate"
			subtitle="Vertical bar chart — average completion per profile type"
			className="flex h-full flex-col"
			contentClassName="min-h-[280px] flex-1"
			legend={[
				<ChartLegendItem
					key="ok"
					color={STATUS_COLORS.APPROVED}
					label={`≥ ${COMPLETION_THRESHOLD}% — on target`}
				/>,
				<ChartLegendItem
					key="bad"
					color={STATUS_COLORS.REJECTED}
					label={`< ${COMPLETION_THRESHOLD}% — needs attention`}
				/>,
			]}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 20, left: 4, right: 8 }}>
					<CartesianGrid stroke={theme.grid} vertical={false} />
					<XAxis dataKey="role" tick={{ fill: theme.label, fontSize: 11 }} />
					<YAxis
						domain={[0, 100]}
						ticks={[0, 25, 50, 75, 100]}
						width={40}
						tick={{ fill: theme.label, fontSize: 11 }}
						tickFormatter={(v) => `${v}%`}
					/>
					<Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Average"]} />
					<ReferenceLine
						y={COMPLETION_THRESHOLD}
						stroke={STATUS_COLORS.PENDING}
						strokeDasharray="4 4"
					/>
					<Bar dataKey="rate" name="Average" radius={[4, 4, 0, 0]}>
						{data.map((entry) => (
							<Cell
								key={entry.key}
								fill={
									entry.rate >= COMPLETION_THRESHOLD
										? STATUS_COLORS.APPROVED
										: STATUS_COLORS.REJECTED
								}
							/>
						))}
						<LabelList
							dataKey="rate"
							position="top"
							formatter={(value: number) => `${value.toFixed(1)}%`}
							style={{ fill: theme.label, fontSize: 11, fontWeight: 600 }}
						/>
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
