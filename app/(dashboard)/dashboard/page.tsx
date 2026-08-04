"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import api from "@/lib/api";
import { CompletionRatesBarChart } from "@/components/dashboard/charts/completion-rates-bar-chart";
import { IndustrySectorsBarChart } from "@/components/dashboard/charts/industry-sectors-bar-chart";
import { MonthlyTrendsLineChart } from "@/components/dashboard/charts/monthly-trends-line-chart";
import { SizeDistributionBarChart } from "@/components/dashboard/charts/size-distribution-bar-chart";
import { StatusByRoleBarChart } from "@/components/dashboard/charts/status-by-role-bar-chart";
import { StatusDonutChart } from "@/components/dashboard/charts/status-donut-chart";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

function formatShare(value: number, total: number) {
	if (total <= 0) return "0% of total";
	return `${Math.round((value / total) * 100)}% of total`;
}

export default function DashboardPage() {
	const currentYear = new Date().getFullYear();
	const [selectedYear, setSelectedYear] = React.useState<number | "all">(
		() => new Date().getFullYear()
	);

	const { data, isLoading, isError, refetch } = api.AdminDashboard.GetStats.useQuery(selectedYear);

	const yearOptions = React.useMemo(() => {
		const years = new Set<number>();
		for (let year = currentYear; year >= currentYear - 10; year -= 1) {
			years.add(year);
		}
		if (data?.meta.year != null) {
			const y = Number(data.meta.year);
			if (Number.isFinite(y)) {
				years.add(y);
			}
		}
		return Array.from(years).sort((a, b) => b - a);
	}, [currentYear, data]);

	if (isLoading) return <DashboardSkeleton />;

	if (isError || !data) {
		return (
			<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-4">
				<p className="text-sm text-muted-foreground">
					Failed to load dashboard statistics.
				</p>
				<Button variant="outline" onClick={() => refetch()}>
					Try again
				</Button>
			</div>
		);
	}

	const { totals } = data;
	const isAllTime = selectedYear === "all";
	const canGoNextYear = !isAllTime && selectedYear < currentYear;
	const yearLabel = selectedYear === "all" ? "All Time" : selectedYear;

	return (
		<div className="flex flex-col gap-6 py-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
						Overview
					</h1>
					<p className="text-sm text-muted-foreground">
						Platform analytics for {yearLabel}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-10 w-10"
						disabled={isAllTime}
						onClick={() =>
							setSelectedYear((year) => (year === "all" ? year : year - 1))
						}
						aria-label="Previous year"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Select
						value={String(selectedYear)}
						onValueChange={(value) =>
							setSelectedYear(value === "all" ? "all" : Number(value))
						}
					>
						<SelectTrigger
							aria-label="Selected year"
							className="h-10 min-w-[7rem] w-auto bg-card"
						>
							<SelectValue placeholder="Year">{yearLabel}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Time</SelectItem>
							{yearOptions.map((year) => (
								<SelectItem key={year} value={String(year)}>
									{year}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						type="button"
						variant="outline"
						size="icon"
						className="h-10 w-10"
						onClick={() =>
							setSelectedYear((year) => (year === "all" ? year : year + 1))
						}
						disabled={isAllTime || !canGoNextYear}
						aria-label="Next year"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<DashboardMetricCard
					label="Business profiles"
					value={totals.sme}
					subtext={formatShare(totals.sme, totals.total)}
				/>
				<DashboardMetricCard
					label="Expert profiles"
					value={totals.advisor}
					subtext={formatShare(totals.advisor, totals.total)}
				/>
				<DashboardMetricCard
					label="Mentor profiles"
					value={totals.investor}
					subtext={formatShare(totals.investor, totals.total)}
				/>
				<DashboardMetricCard
					label="Total profiles"
					value={totals.total}
					subtext={`All profile types in ${yearLabel}`}
				/>
			</div>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<StatusDonutChart statusDistribution={data.statusDistribution} />
				<StatusByRoleBarChart statusDistribution={data.statusDistribution} />
			</div>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<MonthlyTrendsLineChart monthlyTrends={data.monthlyTrends} />
				<IndustrySectorsBarChart industrySectors={data.industrySectors} />
			</div>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<CompletionRatesBarChart completionRates={data.completionRates} />
				<SizeDistributionBarChart sizeDistribution={data.sizeDistribution} />
			</div>
		</div>
	);
}
