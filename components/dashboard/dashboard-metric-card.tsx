"use client";

import { DASHBOARD_PANEL_CLASS } from "@/components/dashboard/chart-utils";
import { cn } from "@/lib/utils";

type DashboardMetricCardProps = {
	label: string;
	value: number | string;
	subtext?: string;
	valueClassName?: string;
};

export function DashboardMetricCard({
	label,
	value,
	subtext,
	valueClassName,
}: DashboardMetricCardProps) {
	return (
		<div className={cn("rounded-md p-4", DASHBOARD_PANEL_CLASS)}>
			<p className="m-0 mb-1 text-[13px] text-slate-500">{label}</p>
			<p
				className={cn(
					"m-0 text-[26px] font-semibold text-slate-900",
					valueClassName
				)}
			>
				{value}
			</p>
			{subtext ? (
				<p className="m-0 mt-1 text-xs text-slate-500">{subtext}</p>
			) : null}
		</div>
	);
}
