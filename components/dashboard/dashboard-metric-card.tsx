"use client";

import { BRAND_GREEN } from "@/components/dashboard/chart-utils";

type DashboardMetricCardProps = {
	label: string;
	value: number | string;
	subtext?: string;
};

function formatValue(value: number | string) {
	return typeof value === "number" ? value.toLocaleString() : value;
}

export function DashboardMetricCard({
	label,
	value,
	subtext,
}: DashboardMetricCardProps) {
	return (
		<div className="rounded-md bg-secondary p-4">
			<p className="mb-1 text-[13px] text-muted-foreground">{label}</p>
			<p className="m-0 text-[26px] font-medium" style={{ color: BRAND_GREEN }}>
				{formatValue(value)}
			</p>
			{subtext ? (
				<p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
			) : null}
		</div>
	);
}
