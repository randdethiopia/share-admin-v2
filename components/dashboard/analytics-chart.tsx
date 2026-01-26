"use client";

import * as React from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { AnalyticsPoint } from "@/lib/transform";
import { Card, CardContent } from "@/components/ui/card";

type OverviewChartProps = {
	title: string;
	data: readonly AnalyticsPoint[];
	colorVar?: string;
};

function sanitizeId(value: string) {
	return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

export function OverviewChart({ title, data, colorVar }: OverviewChartProps) {
	// Default brand green (fallback)
	const fallbackGreen = "#34A853";
	const strokeColor = colorVar ? `hsl(var(--${colorVar}))` : fallbackGreen;

	const reactId = React.useId();
	const gradientId = React.useMemo(
		() => `gradient-${sanitizeId(title) || "series"}-${reactId.replace(/:/g, "")}`,
		[title, reactId]
	);

	const safeStroke = strokeColor;

	return (
		<Card className="border border-gray-50 shadow-sm rounded-[2.5rem] bg-white">
			<CardContent className="p-8 h-96 flex flex-col">
				<h3 className="text-lg font-bold text-gray-700 mb-8 px-2">{title}</h3>
				<div className="flex-1 w-full">
					{data.length === 0 ? (
						<div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-500">
							No data for the selected range
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={data as AnalyticsPoint[]}
								margin={{ left: 12, right: 12, top: 10, bottom: 0 }}
							>
							<defs>
								<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor={safeStroke} stopOpacity={0.4} />
									<stop offset="95%" stopColor={safeStroke} stopOpacity={0} />
								</linearGradient>
							</defs>

							<CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />

							<XAxis
								dataKey="date"
								fontSize={10}
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#94a3b8" }}
								dy={10}
							/>

							<YAxis
								fontSize={10}
								tickLine={false}
								axisLine={false}
								tick={{ fill: "#94a3b8" }}
							/>

							<Tooltip
								contentStyle={{
									borderRadius: "15px",
									border: "none",
									boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
								}}
							/>

							<Area
								type="monotone"
								dataKey="value"
								stroke={safeStroke}
								strokeWidth={3}
								fill={`url(#${gradientId})`}
								animationDuration={1500}
							/>
							</AreaChart>
						</ResponsiveContainer>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

// Back-compat: existing dashboard code imports `AnalyticsChart`.
export const AnalyticsChart = OverviewChart;

