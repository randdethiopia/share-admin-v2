"use client";

import { AgeGroupDistributionChart } from "./components/age-group-distribution-chart";
import { CompletionByRegionChart } from "./components/completion-by-region-chart";
import { CompletionRatePerCourseChart } from "./components/completion-rate-per-course-chart";
import { CourseCompletionDonutChart } from "./components/course-completion-donut-chart";
import { MetricCards } from "./components/metric-cards";
import { MonthlyEnrolmentChart } from "./components/monthly-enrolment-chart";
import { ParticipantsByGenderChart } from "./components/participants-by-gender-chart";

export default function TraineeStatPage() {
	return (
		<div className="flex flex-col gap-6 py-4">
			<h2 className="sr-only">
				Training participants dashboard — sample charts and metrics showing course
				completion, demographics, and regional distribution
			</h2>

			<MetricCards />

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<CourseCompletionDonutChart />
				<CompletionByRegionChart />
			</div>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<MonthlyEnrolmentChart />
				<ParticipantsByGenderChart />
			</div>

			<CompletionRatePerCourseChart />
			<AgeGroupDistributionChart />
		</div>
	);
}
