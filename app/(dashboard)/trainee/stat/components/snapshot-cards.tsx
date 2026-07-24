import type { ReactNode } from "react";
import type {
	TraineeReportAgeGroup,
	TraineeReportGender,
	TraineeReportRegion,
	TraineeReportTrainees,
} from "@/lib/api/trainee";

import { BRAND_GREEN } from "./chart-colors";

function formatGenderLabel(gender: string) {
	return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function pickHighestByTotal<T extends { total: number }>(
	items: T[],
	isUnknown: (item: T) => boolean
) {
	const candidates = items.filter((item) => item.total > 0 && !isUnknown(item));
	const pool = candidates.length > 0 ? candidates : items.filter((item) => item.total > 0);

	return pool.reduce<T | null>((best, item) => {
		if (!best || item.total > best.total) return item;
		return best;
	}, null);
}

type SnapshotCardProps = {
	label: string;
	description: string;
	children: ReactNode;
};

function SnapshotCard({ label, description, children }: SnapshotCardProps) {
	return (
		<div
			className="rounded-md border border-border/50 bg-card px-3.5 py-3"
			style={{ borderTopColor: BRAND_GREEN, borderTopWidth: 3 }}
		>
			<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<p className="mt-1 text-xs text-muted-foreground">{description}</p>
			<div className="mt-1.5">{children}</div>
		</div>
	);
}

type SnapshotCardsProps = {
	trainees: TraineeReportTrainees;
	gender: TraineeReportGender[];
	ageGroups: TraineeReportAgeGroup[];
	regions: TraineeReportRegion[];
};

function percentOfTotalTrainees(snapshotValue: number, totalTrainees: number) {
	return Math.round((snapshotValue / (totalTrainees || 1)) * 100);
}

const snapshotRowClassName =
	"flex w-fit items-baseline gap-6 text-xs text-muted-foreground";

export function SnapshotCards({ trainees, gender, ageGroups, regions }: SnapshotCardsProps) {
	const totalTrainees = trainees.total;
	const topGender = pickHighestByTotal(gender, () => false);
	const topAge = pickHighestByTotal(ageGroups, (item) => item.ageGroup === "Unknown");
	const topRegion = pickHighestByTotal(regions, (item) => item.region === "Unknown");

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<SnapshotCard
				label="Gender snapshot"
				description="Gender with the highest number of trainees"
			>
				{topGender ? (
					<>
						<p className="text-lg font-semibold" style={{ color: BRAND_GREEN }}>
							{formatGenderLabel(topGender.gender)}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{topGender.total.toLocaleString()} trainees (
							{percentOfTotalTrainees(topGender.total, totalTrainees)}%)
						</p>
						<div className="mt-2 space-y-0.5">
							{[...gender]
								.sort((a, b) => b.total - a.total)
								.map((entry) => (
									<div key={entry.gender} className={snapshotRowClassName}>
										<span>{formatGenderLabel(entry.gender)}</span>
										<span className="tabular-nums">{entry.total.toLocaleString()}</span>
									</div>
								))}
						</div>
					</>
				) : (
					<p className="text-sm text-muted-foreground">No gender data</p>
				)}
			</SnapshotCard>

			<SnapshotCard
				label="Age group snapshot"
				description="Age group with the highest number of trainees"
			>
				{topAge ? (
					<>
						<p className="text-lg font-semibold" style={{ color: BRAND_GREEN }}>
							{topAge.ageGroup}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{topAge.total.toLocaleString()} trainees (
							{percentOfTotalTrainees(topAge.total, totalTrainees)}%)
						</p>
						<div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
							<div className={snapshotRowClassName}>
								<span>Completed</span>
								<span className="font-medium tabular-nums" style={{ color: BRAND_GREEN }}>
									{topAge.completed.toLocaleString()} (
									{percentOfTotalTrainees(topAge.completed, totalTrainees)}%)
								</span>
							</div>
							<div className={snapshotRowClassName}>
								<span>In progress</span>
								<span className="tabular-nums">{topAge.inProgress.toLocaleString()}</span>
							</div>
							<div className={snapshotRowClassName}>
								<span>Accessed, not started</span>
								<span className="tabular-nums">
									{topAge.accessedNotStarted.toLocaleString()}
								</span>
							</div>
						</div>
					</>
				) : (
					<p className="text-sm text-muted-foreground">No age group data</p>
				)}
			</SnapshotCard>

			<SnapshotCard
				label="Regional snapshot"
				description="Region with the highest number of trainees"
			>
				{topRegion ? (
					<>
						<p className="text-lg font-semibold" style={{ color: BRAND_GREEN }}>
							{topRegion.region}
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{topRegion.total.toLocaleString()} trainees (
							{percentOfTotalTrainees(topRegion.total, totalTrainees)}%)
						</p>
						<div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
							<div className={snapshotRowClassName}>
								<span>Completed</span>
								<span className="font-medium tabular-nums" style={{ color: BRAND_GREEN }}>
									{topRegion.completed.toLocaleString()} (
									{percentOfTotalTrainees(topRegion.completed, totalTrainees)}%)
								</span>
							</div>
							<div className={snapshotRowClassName}>
								<span>In progress</span>
								<span className="tabular-nums">{topRegion.inProgress.toLocaleString()}</span>
							</div>
							<div className={snapshotRowClassName}>
								<span>Accessed, not started</span>
								<span className="tabular-nums">
									{topRegion.accessedNotStarted.toLocaleString()}
								</span>
							</div>
						</div>
					</>
				) : (
					<p className="text-sm text-muted-foreground">No region data</p>
				)}
			</SnapshotCard>
		</div>
	);
}
