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
import { ChartPanel } from "@/components/dashboard/chart-panel";
import { mapStatusDonutData } from "@/components/dashboard/chart-utils";

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
			legend={data.map((item) => {
				const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
				return (
					<button
						key={item.status}
						type="button"
						onClick={() => setSelectedStatus(item.status)}
						className={`flex items-center gap-2 rounded-md border px-2 py-1 text-left transition-colors ${
							selectedStatus === item.status
								? "border-border bg-secondary font-medium"
								: "border-transparent hover:bg-muted/50"
						}`}
					>
						<span
							className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
							style={{ backgroundColor: item.fill }}
							aria-hidden
						/>
						<span className="text-sm text-foreground">
							{item.name}
								<span className="ml-1.5 font-semibold tabular-nums">
								{item.value.toLocaleString()}
								<span className="font-normal text-muted-foreground">
									{" "}
									({percent} %)
								</span>
							</span>
						</span>
					</button>
				);
			})}
		>
			<div className="flex h-full flex-col justify-between">
				{data.length === 0 ? (
					<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
									stroke="hsl(var(--background))"
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
					<div className="mt-4 rounded-md border border-border/50 bg-secondary/60 p-4">
						<h4 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
							{selectedStatus.toLowerCase()} profiles composition
						</h4>
						<div className="grid grid-cols-3 gap-3">
							<Link
								href={`/business?status=${selectedStatus}`}
								className="group rounded-md border border-border/50 bg-card p-3 text-left transition-colors hover:border-border"
							>
								<p className="text-[8px] font-medium uppercase text-muted-foreground">
									Businesses
								</p>
								<p className="text-lg font-semibold text-foreground">{getRoleCount("sme")}</p>
							</Link>

							<Link
								href={`/expert?status=${selectedStatus}`}
								className="group rounded-md border border-border/50 bg-card p-3 text-left transition-colors hover:border-border"
							>
								<p className="text-[8px] font-medium uppercase text-muted-foreground">
									Experts
								</p>
								<p className="text-lg font-semibold text-foreground">{getRoleCount("advisor")}</p>
							</Link>

							<Link
								href={`/mentor?status=${selectedStatus}`}
								className="group rounded-md border border-border/50 bg-card p-3 text-left transition-colors hover:border-border"
							>
								<p className="text-[8px] font-medium uppercase text-muted-foreground">
									Mentors
								</p>
								<p className="text-lg font-semibold text-foreground">{getRoleCount("investor")}</p>
							</Link>
						</div>
					</div>
				)}
			</div>
		</ChartPanel>
	);
}
