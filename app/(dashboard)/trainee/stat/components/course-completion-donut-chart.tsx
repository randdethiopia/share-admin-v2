"use client";

import type { TraineeReportTrainees } from "@/lib/api/trainee";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartPanel } from "./chart-panel";
import { TRAINING_STATUS_DEFINITIONS } from "./training-status-definitions";
import {
	TrainingStatusGuide,
	TrainingStatusLegend,
} from "./training-status-guide";

function toPercent(value: number, total: number) {
	if (total <= 0) return 0;
	return Math.round((value / total) * 100);
}

function formatCount(value: number) {
	return value.toLocaleString();
}

type SegmentLabelProps = {
	cx?: number;
	cy?: number;
	midAngle?: number;
	innerRadius?: number;
	outerRadius?: number;
	percent?: number;
	payload?: { count: number; value: number };
};

function renderSegmentLabel({
	cx = 0,
	cy = 0,
	midAngle = 0,
	innerRadius = 0,
	outerRadius = 0,
	percent = 0,
	payload,
}: SegmentLabelProps) {
	if (percent < 0.04 || !payload) return null;

	const RADIAN = Math.PI / 180;
	const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);

	return (
		<text
			x={x}
			y={y}
			fill="#fff"
			textAnchor="middle"
			dominantBaseline="central"
			fontSize={10}
			fontWeight={600}
		>
			<tspan x={x} dy="-0.35em">
				{formatCount(payload.count)}
			</tspan>
			<tspan x={x} dy="1.2em">
				{payload.value}%
			</tspan>
		</text>
	);
}

type DonutChartContentProps = {
	segments: Array<{ name: string; count: number; value: number; fill: string }>;
	total: number;
	ariaLabel: string;
};

function DonutChartContent({ segments, total, ariaLabel }: DonutChartContentProps) {
	return (
		<div className="relative h-full w-full">
			<ResponsiveContainer width="100%" height="100%">
				<PieChart role="img" aria-label={`Donut chart: ${ariaLabel}`}>
					<Tooltip
						formatter={(_value: number, _name: string, item) => {
							const payload = item.payload as { count: number; value: number; name: string };
							return [
								`${formatCount(payload.count)} (${payload.value}%)`,
								payload.name,
							];
						}}
					/>
					<Pie
						data={segments}
						dataKey="value"
						nameKey="name"
						innerRadius="65%"
						outerRadius="100%"
						strokeWidth={2}
						stroke="hsl(var(--background))"
						label={renderSegmentLabel}
						labelLine={false}
					>
						{segments.map((entry) => (
							<Cell key={entry.name} fill={entry.fill} />
						))}
					</Pie>
				</PieChart>
			</ResponsiveContainer>
			<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
				<p className="text-xs text-muted-foreground">Total</p>
				<p className="text-lg font-medium text-foreground">{formatCount(total)}</p>
			</div>
		</div>
	);
}

type CourseCompletionDonutChartProps = {
	trainees: TraineeReportTrainees;
};

export function CourseCompletionDonutChart({ trainees }: CourseCompletionDonutChartProps) {
	const { total, completed, inProgress, accessedNotStarted } = trainees;

	const counts = {
		completed,
		inProgress,
		accessedNotStarted,
	};

	const segments = TRAINING_STATUS_DEFINITIONS.map((item) => ({
		name: item.shortLabel,
		count: counts[item.key],
		value: toPercent(counts[item.key], total),
		fill: item.color,
	})).filter((segment) => segment.count > 0);

	const ariaLabel = TRAINING_STATUS_DEFINITIONS.map((item) => {
		const count = counts[item.key];
		const percent = toPercent(count, total);
		return `${formatCount(count)} ${item.label.toLowerCase()} (${percent}%)`;
	}).join(", ");

	return (
		<ChartPanel
			title="Course completion status"
			legend={
				<TrainingStatusLegend
					getValue={(key) => {
						const count = counts[key];
						const percent = toPercent(count, total);
						return `${formatCount(count)} (${percent}%)`;
					}}
				/>
			}
			magnifiedAside={<TrainingStatusGuide />}
		>
			<DonutChartContent segments={segments} total={total} ariaLabel={ariaLabel} />
		</ChartPanel>
	);
}
