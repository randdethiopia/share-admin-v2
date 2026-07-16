"use client";

import {
	Children,
	cloneElement,
	isValidElement,
	useState,
	type ReactNode,
} from "react";
import { Expand } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ChartPanelProps = {
	title: string;
	subtitle?: string;
	legend?: ReactNode;
	children: ReactNode;
	className?: string;
	chartHeightClassName?: string;
	magnifiedAside?: ReactNode;
};

function cloneChartChildren(children: ReactNode) {
	return Children.map(children, (child) =>
		isValidElement(child) ? cloneElement(child) : child
	);
}

export function ChartPanel({
	title,
	subtitle,
	legend,
	children,
	className,
	chartHeightClassName = "h-[200px]",
	magnifiedAside,
}: ChartPanelProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div
				className={cn(
					"rounded-lg border border-border/60 bg-card p-5",
					className
				)}
			>
				<div className="mb-4 flex items-start justify-between gap-2">
					<div className="min-w-0">
						<p className="text-sm font-medium text-foreground">{title}</p>
						{subtitle ? (
							<p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
						) : null}
					</div>
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label={`Enlarge ${title}`}
						title="Enlarge chart"
					>
						<Expand className="h-4 w-4" />
					</button>
				</div>
				{legend}
				<div className={cn("relative w-full", chartHeightClassName)}>
					{children}
				</div>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className={cn(
						"flex max-h-[90vh] flex-col gap-4 overflow-y-auto",
						magnifiedAside
							? "w-[min(96vw,1100px)] max-w-[1100px] sm:max-w-[1100px]"
							: "w-[min(96vw,1100px)] max-w-[1100px] sm:max-w-[1100px]"
					)}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					{subtitle ? (
						<p className="text-xs text-muted-foreground">{subtitle}</p>
					) : null}
					{!magnifiedAside ? legend : null}
					{open ? (
						magnifiedAside ? (
							<div
								key="magnified-chart-split"
								className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
							>
								<div className="relative h-[min(70vh,520px)] w-full min-h-[320px]">
									{cloneChartChildren(children)}
								</div>
								<aside className="px-2 lg:px-4">{magnifiedAside}</aside>
							</div>
						) : (
							<div
								key="magnified-chart"
								className="relative h-[min(70vh,560px)] w-full min-h-[360px]"
							>
								{cloneChartChildren(children)}
							</div>
						)
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}
