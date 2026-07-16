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

import type { AdminDashboardStats } from "@/lib/api/admin-dashboard";
import { ChartLegendItem, ChartPanel } from "@/components/dashboard/chart-panel";
import {
	getChartTheme,
	mapStatusByRoleData,
	STATUS_COLORS,
} from "@/components/dashboard/chart-utils";

type Props = {
	statusDistribution: AdminDashboardStats["statusDistribution"];
};

const STATUS_KEYS = ["APPROVED", "PENDING", "REJECTED", "DRAFT"] as const;

export function StatusByRoleBarChart({ statusDistribution }: Props) {
	const theme = getChartTheme();
	const data = mapStatusByRoleData(statusDistribution);

	return (
		<ChartPanel
			title="Status by profile type"
			subtitle="Vertical grouped bar — status per role"
			className="flex h-full flex-col"
			contentClassName="min-h-[320px] flex-1"
			legend={STATUS_KEYS.map((status) => (
				<ChartLegendItem
					key={status}
					color={STATUS_COLORS[status]}
					label={status.charAt(0) + status.slice(1).toLowerCase()}
				/>
			))}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 8, left: 0, right: 8, bottom: 0 }}>
					<CartesianGrid stroke={theme.grid} vertical={false} />
					<XAxis
						dataKey="role"
						tick={{ fill: theme.label, fontSize: 11 }}
					/>
					<YAxis tick={{ fill: theme.label, fontSize: 11 }} />
					<Tooltip />
					{STATUS_KEYS.map((status) => (
						<Bar
							key={status}
							dataKey={status}
							name={status.charAt(0) + status.slice(1).toLowerCase()}
							fill={STATUS_COLORS[status]}
							radius={[4, 4, 0, 0]}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</ChartPanel>
	);
}
