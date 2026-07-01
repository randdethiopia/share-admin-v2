"use client";

import {
	Area,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import type { AdminDashboardStats } from "@/lib/api/admin-dashboard";
import { ChartLegendItem, ChartPanel } from "@/components/dashboard/chart-panel";
import {
	getChartTheme,
	LINE_COLORS,
	mapMonthlyTrendsData,
} from "@/components/dashboard/chart-utils";

type Props = {
	monthlyTrends: AdminDashboardStats["monthlyTrends"];
};

const ROLE_TOOLTIP_LABELS: Record<string, string> = {
	sme: "Business",
	advisor: "Expert",
	investor: "Mentor",
};

function MonthlyTrendsTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: Array<{
		dataKey?: string | number;
		name?: string;
		value?: number;
		color?: string;
	}>;
	label?: string;
}) {
	if (!active || !payload?.length) return null;

	const seen = new Set<string>();
	const items = payload.filter((item) => {
		const key = String(item.dataKey ?? "");
		if (!key || seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	return (
		<div className="rounded-md border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-sm">
			<p className="mb-1 font-medium text-slate-900">{label}</p>
			<ul className="space-y-1">
				{items.map((item) => {
					const dataKey = String(item.dataKey ?? "");
					const displayName =
						ROLE_TOOLTIP_LABELS[dataKey] || item.name || dataKey;
					return (
						<li key={dataKey} className="flex items-center gap-2 text-slate-700">
							<span
								className="inline-block h-2 w-2 rounded-full"
								style={{ backgroundColor: item.color }}
							/>
							<span>
								{displayName}: {item.value}
							</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function MonthlyTrendsLineChart({ monthlyTrends }: Props) {
	const theme = getChartTheme();
	const data = mapMonthlyTrendsData(monthlyTrends);

	return (
		<ChartPanel
			title="Monthly signups"
			subtitle="Line chart — trends over 12 months"
			legend={[
				<ChartLegendItem key="sme" color={LINE_COLORS.sme} label="Business" />,
				<ChartLegendItem key="advisor" color={LINE_COLORS.advisor} label="Expert" />,
				<ChartLegendItem key="investor" color={LINE_COLORS.investor} label="Mentor" />,
			]}
		>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
					<CartesianGrid stroke={theme.grid} />
					<XAxis dataKey="label" tick={{ fill: theme.label, fontSize: 11 }} />
					<YAxis tick={{ fill: theme.label, fontSize: 11 }} />
					<Tooltip content={<MonthlyTrendsTooltip />} />
					<Area
						type="monotone"
						dataKey="sme"
						name="Business"
						stroke="none"
						fill={LINE_COLORS.sme}
						fillOpacity={0.08}
					/>
					<Area
						type="monotone"
						dataKey="advisor"
						name="Expert"
						stroke="none"
						fill={LINE_COLORS.advisor}
						fillOpacity={0.08}
					/>
					<Line
						type="monotone"
						dataKey="sme"
						name="Business"
						stroke={LINE_COLORS.sme}
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
					<Line
						type="monotone"
						dataKey="advisor"
						name="Expert"
						stroke={LINE_COLORS.advisor}
						strokeWidth={2}
						strokeDasharray="5 4"
						dot={{ r: 3 }}
					/>
					<Line
						type="monotone"
						dataKey="investor"
						name="Mentor"
						stroke={LINE_COLORS.investor}
						strokeWidth={2}
						dot={{ r: 3 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
