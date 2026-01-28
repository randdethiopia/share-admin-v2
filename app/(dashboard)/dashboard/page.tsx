"use client";

import * as React from "react";

import AdvisorProfileApi from "@/api/advisor-profile";
import SmeProfileApi from "@/api/Buisness";
import InvestorProfileApi from "@/api/mentor";
import { transformAnalyticsData } from "@/lib/transform";
import { cn } from "@/lib/utils";

import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/shared/page-skeletons";

const FILTERS = [
	{ label: "Last 7 Days", days: 7 },
	{ label: "Last Month", days: 30 },
	{ label: "Last Year", days: 365 },
] as const;

type Filter = (typeof FILTERS)[number];

export default function DashboardPage() {
	const [activeFilter, setActiveFilter] = React.useState<Filter>(FILTERS[0]);

	const { data: experts = [], isLoading: isExpertsLoading } =
		AdvisorProfileApi.GetList.useQuery();
	const { data: businesses = [], isLoading: isBusinessesLoading } =
		SmeProfileApi.GetList.useQuery();
	const { data: investors = [], isLoading: isInvestorsLoading } =
		InvestorProfileApi.GetList.useQuery();

	const isLoading = isExpertsLoading || isBusinessesLoading || isInvestorsLoading;

	const expertChart = React.useMemo(
		() => transformAnalyticsData(experts, activeFilter.days),
		[experts, activeFilter.days]
	);

	const smeChart = React.useMemo(
		() => transformAnalyticsData(businesses, activeFilter.days),
		[businesses, activeFilter.days]
	);

	const investorChart = React.useMemo(
		() => transformAnalyticsData(investors, activeFilter.days),
		[investors, activeFilter.days]
	);

	if (isLoading) return <DashboardSkeleton />;

	return (
		<div className="mx-auto w-full max-w-400 space-y-6 sm:space-y-8 px-3 sm:px-6 xl:px-10">
			{/* Header */}
			<div className="space-y-1">
				<h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold">
					Overview
				</h1>
				<p className="text-sm sm:text-base text-muted-foreground">
					See system analytics
				</p>
			</div>

			{/* Filters */}
			{(() => {
				const activeIndex = FILTERS.findIndex(
					(filter) => filter.label === activeFilter.label
				);

				return (
					<div className="w-full overflow-x-auto">
						<div className="inline-grid min-w-[320px] w-full max-w-md grid-cols-3 rounded-2xl border border-blue-100 bg-white p-1 shadow-sm">
							<div className="relative col-span-3">
								<span
									aria-hidden="true"
									className="absolute inset-y-1 left-1 rounded-xl bg-blue-600 shadow-sm transition-transform duration-300 ease-out"
									style={{
										width: "calc((100% - 0.5rem) / 3)",
										transform: `translateX(${Math.max(0, activeIndex) * 100}%)`,
									}}
								/>
								<div className="relative z-10 grid grid-cols-3">
									{FILTERS.map((filter) => {
										const isActive = activeFilter.label === filter.label;
										return (
											<Button
												key={filter.label}
												variant="ghost"
												size="sm"
												aria-pressed={isActive}
												onClick={() => setActiveFilter(filter)}
												className={cn(
													"h-9 sm:h-10 rounded-xl px-2 sm:px-3 text-xs sm:text-sm font-semibold transition-colors",
													isActive
														? "text-white hover:bg-transparent"
														: "text-slate-600 hover:bg-blue-50"
												)}
											>
												{filter.label}
											</Button>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				);
			})()}

			{/* Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
				<StatCard title="Total Expert" value={experts.length} percentage="+0%" />
				<StatCard title="Total Business" value={businesses.length} percentage="+0%" />
				<StatCard title="Total Mentor" value={investors.length} percentage="+0%" />
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
				<AnalyticsChart title="Mentor" data={investorChart} />
				<AnalyticsChart title="Business" data={smeChart} />
				<AnalyticsChart
					title="Expert"
					data={expertChart}
					className="xl:col-span-2 h-75 sm:h-90 xl:h-105 2xl:h-125"
				/>
			</div>
		</div>
	);
}
