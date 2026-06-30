"use client";

import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import type { AdminDashboardStats } from "@/lib/api/admin-dashboard";
import { ChartLegendItem, ChartPanel } from "@/components/dashboard/chart-panel";
import { mapStatusDonutData, STATUS_COLORS } from "@/components/dashboard/chart-utils";

type Props = {
	statusDistribution: AdminDashboardStats["statusDistribution"];
};

export function StatusDonutChart({ statusDistribution }: Props) {
	const data = mapStatusDonutData(statusDistribution).filter((item) => item.value > 0);
	const total = data.reduce((sum, item) => sum + item.value, 0);

	return (
		<ChartPanel
			title="Profile status overview"
			subtitle="Donut chart — proportion by status across all profiles"
			legend={data.map((item) => (
				<ChartLegendItem
					key={item.status}
					color={item.fill}
					label={`${item.name} ${total > 0 ? Math.round((item.value / total) * 100) : 0}%`}
				/>
			))}
		>
			{data.length === 0 ? (
				<div className="flex h-full items-center justify-center text-sm text-slate-500">
					No status data for the selected year
				</div>
			) : (
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							dataKey="value"
							nameKey="name"
							innerRadius="65%"
							outerRadius="90%"
							paddingAngle={2}
							strokeWidth={2}
						>
							{data.map((entry) => (
								<Cell key={entry.status} fill={entry.fill} />
							))}
						</Pie>
						<Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
					</PieChart>
				</ResponsiveContainer>
			)}
		</ChartPanel>
	);
}

export { STATUS_COLORS };
