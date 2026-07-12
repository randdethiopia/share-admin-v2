"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

import type { AdminDashboardStats, ProfileStatusKey } from "@/lib/api/admin-dashboard";
import { ChartLegendItem, ChartPanel } from "@/components/dashboard/chart-panel";
import { mapStatusDonutData, STATUS_COLORS } from "@/components/dashboard/chart-utils";

type Props = {
	statusDistribution: AdminDashboardStats["statusDistribution"];
};

export function StatusDonutChart({ statusDistribution }: Props) {
	const data = mapStatusDonutData(statusDistribution).filter((item) => item.value > 0);
	const total = data.reduce((sum, item) => sum + item.value, 0);

	const [selectedStatus, setSelectedStatus] = useState<ProfileStatusKey | null>("PENDING");

	const getRoleCount = (role: "sme" | "advisor" | "investor") => {
		if (!selectedStatus) return 0;
		const list = statusDistribution[role] || [];
		const found = list.find(
			(item) => item.status.toUpperCase() === selectedStatus.toUpperCase()
		);
		return found ? found.count : 0;
	};

	return (
		<ChartPanel
			title="Profile status overview"
			subtitle="Donut chart — proportion by status across all profiles"
			contentClassName="min-h-[220px] h-auto"
			legend={data.map((item) => (
				<button
					key={item.status}
					type="button"
					onClick={() => setSelectedStatus(item.status)}
					className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-left transition-all ${
						selectedStatus === item.status
							? "border-slate-200/60 bg-slate-100 font-semibold"
							: "border-transparent hover:bg-slate-50/50"
					}`}
				>
					<ChartLegendItem
						color={item.fill}
						label={`${item.name} ${total > 0 ? Math.round((item.value / total) * 100) : 0}%`}
					/>
				</button>
			))}
		>
			<div className="flex h-full flex-col justify-between">
				{data.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-500">
						No status data for the selected year
					</div>
				) : (
					<div className="h-[220px] w-full">
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
									style={{ cursor: "pointer" }}
									onClick={(_, index) => {
										const clickedStatus = data[index]?.status;
										if (clickedStatus) {
											setSelectedStatus(clickedStatus);
										}
									}}
								>
									{data.map((entry) => (
										<Cell key={entry.status} fill={entry.fill} />
									))}
								</Pie>
								<Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
							</PieChart>
						</ResponsiveContainer>
					</div>
				)}

				{selectedStatus && (
					<div className="mt-4 rounded-xl border border-slate-100/60 bg-slate-50/80 p-4 backdrop-blur-sm">
						<h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
							{selectedStatus.toLowerCase()} Profiles Composition
						</h4>
						<div className="grid grid-cols-3 gap-3">
							<Link
								href={`/business?status=${selectedStatus}`}
								className="group rounded-lg border border-slate-100 bg-white p-3 text-left transition-all hover:border-brand-primary/40 hover:shadow-sm"
							>
								<p className="text-[8px] font-bold text-slate-400 transition-colors group-hover:text-brand-primary">
									BUSINESSES
								</p>
								<p className="text-lg font-black text-slate-800">{getRoleCount("sme")}</p>
							</Link>

							<Link
								href={`/expert?status=${selectedStatus}`}
								className="group rounded-lg border border-slate-100 bg-white p-3 text-left transition-all hover:border-brand-success/40 hover:shadow-sm"
							>
								<p className="text-[8px] font-bold text-slate-400 transition-colors group-hover:text-brand-success">
									EXPERTS
								</p>
								<p className="text-lg font-black text-slate-800">{getRoleCount("advisor")}</p>
							</Link>

							<Link
								href={`/mentor?status=${selectedStatus}`}
								className="group rounded-lg border border-slate-100 bg-white p-3 text-left transition-all hover:border-brand-accent/40 hover:shadow-sm"
							>
								<p className="text-[8px] font-bold text-slate-400 transition-colors group-hover:text-brand-accent">
									MENTORS
								</p>
								<p className="text-lg font-black text-slate-800">{getRoleCount("investor")}</p>
							</Link>
						</div>
					</div>
				)}
			</div>
		</ChartPanel>
	);
}

export { STATUS_COLORS };
