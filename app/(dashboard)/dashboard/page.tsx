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

	// 1) Fetch raw arrays from server
	const { data: experts = [], isLoading: isExpertsLoading } =
		AdvisorProfileApi.GetList.useQuery();
	const { data: businesses = [], isLoading: isBusinessesLoading } =
		SmeProfileApi.GetList.useQuery();
	const { data: investors = [], isLoading: isInvestorsLoading } =
		InvestorProfileApi.GetList.useQuery();

	const isLoading = isExpertsLoading || isBusinessesLoading || isInvestorsLoading;

	// 2) Transform for charts
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
		<div className="space-y-8">
			<div className="space-y-1">
				<h1 className="text-3xl font-bold">Overview</h1>
				<p className="text-muted-foreground">See system analytics</p>
			</div>

			{(() => {
				const activeIndex = FILTERS.findIndex(
					(filter) => filter.label === activeFilter.label
				);

				return (
					<div className="inline-grid w-full max-w-md grid-cols-3 rounded-2xl border border-blue-100 bg-white p-1 shadow-sm">
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
												"h-9 rounded-xl px-3 font-semibold transition-colors duration-200",
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
				);
			})()}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard title="Total Expert" value={experts.length} percentage="+0%" />
				<StatCard title="Total Business" value={businesses.length} percentage="+0%" />
				<StatCard title="Total Mentor" value={investors.length} percentage="+0%" />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<AnalyticsChart title="Mentor" data={investorChart} />
				<AnalyticsChart title="Business" data={smeChart} />
				<div className="lg:col-span-2">
					<AnalyticsChart title="Expert" data={expertChart} />
				</div>
			</div>
		</div>
	);
}