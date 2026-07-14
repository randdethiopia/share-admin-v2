"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChartPanelProps = {
	title: string;
	subtitle?: string;
	legend?: ReactNode;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
};

export function ChartPanel({
	title,
	subtitle,
	legend,
	children,
	className,
	contentClassName,
}: ChartPanelProps) {
	return (
		<div
			className={cn(
				"rounded-lg border border-border/60 bg-card p-5",
				className
			)}
		>
			<p className="text-sm font-medium text-foreground">{title}</p>
			{subtitle ? (
				<p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
			) : null}
			{legend ? (
				<div className="mb-3 mt-4 flex flex-wrap gap-x-4 gap-y-2">{legend}</div>
			) : null}
			<div className={cn("relative w-full", contentClassName ?? "h-[200px]")}>
				{children}
			</div>
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
		<span className="inline-flex items-center gap-2 text-sm text-foreground">
			<span
				className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
				style={{ backgroundColor: color }}
			/>
			{label}
		</span>
	);
}
