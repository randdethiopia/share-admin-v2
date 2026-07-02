import { cn } from "@/lib/utils";

type MetricCardProps = {
	label: string;
	value: string;
	subtext: string;
	valueClassName?: string;
	subtextClassName?: string;
};

function MetricCard({
	label,
	value,
	subtext,
	valueClassName,
	subtextClassName,
}: MetricCardProps) {
	return (
		<div className="rounded-md bg-secondary p-4">
			<p className="mb-1 text-[13px] text-muted-foreground">{label}</p>
			<p className={cn("m-0 text-[26px] font-medium text-foreground", valueClassName)}>
				{value}
			</p>
			<p className={cn("mt-1 text-xs text-muted-foreground", subtextClassName)}>
				{subtext}
			</p>
		</div>
	);
}

export function MetricCards() {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			<MetricCard
				label="Total participants"
				value="1,248"
				subtext="↑ 12% vs last cohort"
				subtextClassName="text-emerald-600 dark:text-emerald-400"
			/>
			<MetricCard
				label="Completed"
				value="786"
				subtext="63% completion rate"
				valueClassName="text-emerald-600 dark:text-emerald-400"
			/>
			<MetricCard
				label="In progress"
				value="312"
				subtext="25% of total"
				valueClassName="text-amber-600 dark:text-amber-400"
			/>
			<MetricCard
				label="Not started / dropped"
				value="150"
				subtext="12% of total"
				valueClassName="text-red-600 dark:text-red-400"
			/>
		</div>
	);
}
