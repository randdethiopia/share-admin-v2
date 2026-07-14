"use client";

import TraineeAuth from "@/lib/api/trainee";

import { AgeGroupDistributionChart } from "./components/age-group-distribution-chart";
import { CompletionByRegionChart } from "./components/completion-by-region-chart";
import { CourseCompletionDonutChart } from "./components/course-completion-donut-chart";
import { MetricCards } from "./components/metric-cards";
import { MonthlyEnrolmentChart } from "./components/monthly-enrolment-chart";
import { ParticipantsByGenderChart } from "./components/participants-by-gender-chart";
import { SnapshotCards } from "./components/snapshot-cards";
import { TraineeStatSkeleton } from "./components/trainee-stat-skeleton";

export default function TraineeStatPage() {
	const { data, isLoading, isError, error } = TraineeAuth.GetReport.useQuery();

	if (isLoading) {
		return <TraineeStatSkeleton />;
	}

	if (isError || !data) {
		const message =
			(error as { response?: { data?: { message?: string } } })?.response?.data
				?.message ?? "Failed to load trainee statistics.";
		return (
			<div className="flex min-h-[40vh] flex-col items-center justify-center py-4">
				<p className="text-sm text-destructive">{message}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 py-4">
			<h2 className="sr-only">
				Training participants dashboard — charts and metrics showing course
				completion, demographics, and regional distribution
			</h2>

			<MetricCards trainees={data.trainees} />

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<CourseCompletionDonutChart trainees={data.trainees} />
				<CompletionByRegionChart regions={data.regions} />
			</div>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<ParticipantsByGenderChart gender={data.gender} />
				<AgeGroupDistributionChart ageGroups={data.ageGroups} />
			</div>

			<MonthlyEnrolmentChart />

			<SnapshotCards
				gender={data.gender}
				ageGroups={data.ageGroups}
				regions={data.regions}
			/>
		</div>
	);
}
