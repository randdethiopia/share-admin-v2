import type { ResultFilter } from "./login-logs.constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { LoginLogSummary } from "@/lib/api/login-log";
import { cn } from "@/lib/utils";

type LoginLogMetricsProps = {
	summary?: LoginLogSummary;
	onResultSelect?: (result: ResultFilter) => void;
};

type Metric = {
	key: string;
	label: string;
	value?: number | string;
	detail?: string;
	result?: ResultFilter;
};

function buildMetrics(summary?: LoginLogSummary): Metric[] {
	const { ADMIN, TRAINEE } = summary?.byUserType ?? {};

	return [
		{ key: "total", label: "TOTAL ATTEMPTS", value: summary?.total },
		{
			key: "successful",
			label: "SUCCESSFUL",
			value: summary?.successful,
			detail: summary ? `Admin ${ADMIN?.successful} · Trainee ${TRAINEE?.successful}` : undefined,
			result: "SUCCESS",
		},
		{
			key: "failed",
			label: "FAILED",
			value: summary?.failed,
			detail: summary ? `Admin ${ADMIN?.failed} · Trainee ${TRAINEE?.failed}` : undefined,
			result: "FAILED",
		},
		{
			key: "rate",
			label: "SUCCESS RATE",
			value: !summary
				? undefined
				: summary.total > 0
					? `${Math.round((summary.successful / summary.total) * 100)}%`
					: "—",
		},
	];
}

export function LoginLogMetrics({ summary, onResultSelect }: LoginLogMetricsProps) {
	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-preserve-percentages>
			{buildMetrics(summary).map((metric) => {
				const select =
					metric.result && onResultSelect
						? () => onResultSelect(metric.result as ResultFilter)
						: undefined;

				return (
					<div
						key={metric.key}
						className={cn(
							"rounded-xl border-0 bg-card px-4 py-3 shadow-xs transition-all hover:shadow-sm",
							select && "cursor-pointer"
						)}
						onClick={select}
						onKeyDown={(event) => {
							if (!select) return;
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								select();
							}
						}}
						role={select ? "button" : undefined}
						tabIndex={select ? 0 : undefined}
					>
						<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
							{metric.label}
						</p>
						{metric.value === undefined ? (
							<Skeleton className="h-7 w-16" />
						) : (
							<p className="text-2xl font-extrabold leading-tight text-[#1A4428]">
								{metric.value}
							</p>
						)}
						{metric.detail ? (
							<p className="mt-0.5 text-[11px] text-muted-foreground">{metric.detail}</p>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
