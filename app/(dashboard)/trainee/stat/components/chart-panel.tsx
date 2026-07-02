import type * as React from "react";

import { cn } from "@/lib/utils";

type ChartPanelProps = {
	title: string;
	subtitle: string;
	legend?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	chartHeightClassName?: string;
};

export function ChartPanel({
	title,
	subtitle,
	legend,
	children,
	className,
	chartHeightClassName = "h-[200px]",
}: ChartPanelProps) {
	return (
		<div
			className={cn(
				"rounded-lg border border-border/60 bg-card p-5",
				className
			)}
		>
			<p className="text-sm font-medium text-foreground">{title}</p>
			<p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
			{legend}
			<div className={cn("relative w-full", chartHeightClassName)}>{children}</div>
		</div>
	);
}
