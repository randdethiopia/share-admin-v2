import type { TraineeReportTrainees } from "@/lib/api/trainee";

import { BRAND_GREEN } from "./chart-colors";
import { TRAINING_STATUS_DEFINITIONS } from "./training-status-definitions";

type MetricCardProps = {
	label: string;
	value: string;
	description: string;
	percentLabel?: string;
};

function MetricCard({ label, value, description, percentLabel }: MetricCardProps) {
	return (
		<div className="rounded-md bg-secondary p-4">
			<p className="mb-1 text-[13px] text-muted-foreground">{label}</p>
			<p className="m-0 text-[26px] font-medium" style={{ color: BRAND_GREEN }}>
				{value}
			</p>
			<p className="mt-1 text-xs text-muted-foreground">{description}</p>
			{percentLabel ? (
				<p className="mt-0.5 text-xs text-muted-foreground">{percentLabel}</p>
			) : null}
		</div>
	);
}

function formatCount(value: number) {
	return value.toLocaleString();
}

function formatPercent(value: number, total: number) {
	if (total <= 0) return "0% of total";
	return `${Math.round((value / total) * 100)}% of total`;
}

type MetricCardsProps = {
	trainees: TraineeReportTrainees;
};

export function MetricCards({ trainees }: MetricCardsProps) {
	const { total, completed, inProgress, accessedNotStarted } = trainees;

	const values = {
		completed,
		inProgress,
		accessedNotStarted,
	};

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			<MetricCard
				label="Total participants"
				value={formatCount(total)}
				description="Total number of participants onboarded to the platform"
			/>
			{TRAINING_STATUS_DEFINITIONS.map((status) => {
				const count = values[status.key];
				return (
					<MetricCard
						key={status.key}
						label={status.label}
						value={formatCount(count)}
						description={status.cardSubtext}
						percentLabel={formatPercent(count, total)}
					/>
				);
			})}
		</div>
	);
}
