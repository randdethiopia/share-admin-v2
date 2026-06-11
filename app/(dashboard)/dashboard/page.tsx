"use client";

import * as React from "react";

import api from "@/lib/api";
import {
	getAnalyticsYear,
	transformAnalyticsData,
	transformAnalyticsDataByYear,
} from "@/lib/transform";
import { cn } from "@/lib/utils";

import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/shared/page-skeletons";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FILTERS = [
	{ label: "Last 7 Days", kind: "days", days: 7 },
	{ label: "Last Month", kind: "days", days: 30 },
	{ label: "Yearly", kind: "year" },
] as const;

type Filter = (typeof FILTERS)[number];

function isApproved(status?: string) {
	return (status ?? "").trim().toUpperCase() === "APPROVED";
}

export default function DashboardPage() {
	const [activeFilter, setActiveFilter] = React.useState<Filter>(FILTERS[0]);
	const [selectedYear, setSelectedYear] = React.useState(() =>
		new Date().getFullYear()
	);

	const { data: experts = [], isLoading: isExpertsLoading } =
		api.AdvisorProfile.GetList.useQuery();
	const { data: businesses = [], isLoading: isBusinessesLoading } =
		api.BusinessProfile.GetList.useQuery();
	const { data: investors = [], isLoading: isInvestorsLoading } =
		api.InvestorProfile.GetList.useQuery();

	const isLoading = isExpertsLoading || isBusinessesLoading || isInvestorsLoading;

	const approvedExperts = React.useMemo(
		() => experts.filter((item) => isApproved(item.status)),
		[experts]
	);

	const approvedBusinesses = React.useMemo(
		() => businesses.filter((item) => isApproved(item.status)),
		[businesses]
	);

	const approvedInvestors = React.useMemo(
		() => investors.filter((item) => isApproved(item.status)),
		[investors]
	);

	const currentYear = new Date().getFullYear();

	const yearOptions = React.useMemo(() => {
		const years = new Set<number>();
		for (let year = currentYear; year >= currentYear - 10; year -= 1) {
			years.add(year);
		}
		for (const item of [
			...approvedExperts,
			...approvedBusinesses,
			...approvedInvestors,
		]) {
			const year = getAnalyticsYear(item);
			if (year) years.add(year);
		}
		return Array.from(years).sort((a, b) => b - a);
	}, [approvedExperts, approvedBusinesses, approvedInvestors, currentYear]);

	const isYearly = activeFilter.kind === "year";
	const canGoNextYear = selectedYear < currentYear;

	const expertChart = React.useMemo(
		() => {
			if (activeFilter.kind === "year") {
				return transformAnalyticsDataByYear(approvedExperts, selectedYear);
			}
			return transformAnalyticsData(approvedExperts, activeFilter.days);
		},
		[approvedExperts, activeFilter, selectedYear]
	);

	const smeChart = React.useMemo(
		() => {
			if (activeFilter.kind === "year") {
				return transformAnalyticsDataByYear(approvedBusinesses, selectedYear);
			}
			return transformAnalyticsData(approvedBusinesses, activeFilter.days);
		},
		[approvedBusinesses, activeFilter, selectedYear]
	);

	const investorChart = React.useMemo(
		() => {
			if (activeFilter.kind === "year") {
				return transformAnalyticsDataByYear(approvedInvestors, selectedYear);
			}
			return transformAnalyticsData(approvedInvestors, activeFilter.days);
		},
		[approvedInvestors, activeFilter, selectedYear]
	);

	const approvedExpertsCount = React.useMemo(
		() => approvedExperts.length,
		[approvedExperts]
	);

	const approvedBusinessesCount = React.useMemo(
		() => approvedBusinesses.length,
		[approvedBusinesses]
	);

	const approvedInvestorsCount = React.useMemo(
		() => approvedInvestors.length,
		[approvedInvestors]
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
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
						{isYearly && (
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="h-10 w-10 rounded-xl"
									onClick={() => setSelectedYear((year) => year - 1)}
									aria-label="Previous year"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
								<Select
									value={String(selectedYear)}
									onValueChange={(value) => setSelectedYear(Number(value))}
								>
									<SelectTrigger className="h-10 w-28 rounded-xl bg-white">
										<SelectValue aria-label="Selected year" />
									</SelectTrigger>
									<SelectContent>
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
									className="h-10 w-10 rounded-xl"
									onClick={() => setSelectedYear((year) => year + 1)}
									disabled={!canGoNextYear}
									aria-label="Next year"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>
				);
			})()}

			{/* Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
				<StatCard title="Total Expert" value={approvedExpertsCount} percentage="+0%" />
				<StatCard title="Total Business" value={approvedBusinessesCount} percentage="+0%" />
				<StatCard title="Total Mentor" value={approvedInvestorsCount} percentage="+0%" />
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
