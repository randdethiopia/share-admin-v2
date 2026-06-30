"use client";

import type { ReactNode } from "react";
import { DASHBOARD_PANEL_CLASS } from "@/components/dashboard/chart-utils";
import { cn } from "@/lib/utils";

type ChartPanelProps = {
	title: string;
	subtitle?: string;
	legend?: ReactNode;
	children: ReactNode;
	className?: string;
};

export function ChartPanel({
	title,
	subtitle,
	legend,
	children,
	className,
}: ChartPanelProps) {
	return (
		<div className={cn("rounded-lg p-5", DASHBOARD_PANEL_CLASS, className)}>
			<p className="font-orbitron text-sm font-medium text-slate-900">{title}</p>
			{subtitle ? (
				<p className="mt-1 text-xs text-slate-500">{subtitle}</p>
			) : null}
			{legend ? <div className="mb-3 mt-4 flex flex-wrap gap-2">{legend}</div> : null}
			<div className="h-[200px] w-full">{children}</div>
		</div>
	);
}

export function ChartLegendItem({
	color,
	label,
}: {
	color: string;
	label: string;
}) {
	return (
		<span className="inline-flex items-center gap-1 text-xs text-slate-800">
			<span
				className="inline-block h-2.5 w-2.5 rounded-sm"
				style={{ backgroundColor: color }}
			/>
			{label}
		</span>
	);
}
