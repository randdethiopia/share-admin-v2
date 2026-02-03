"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import WaitListApi, { type WaitListType } from "@/api/waitlist";
import { AnalyticsSection } from "@/components/wait-list/analyticsSection";
import { ApplicantsList } from "@/components/wait-list/ApplicantsList";
import { ApplicantDetail } from "@/components/wait-list/ApplicantDetail";
import { MobileApplicantDetail } from "@/components/wait-list/MobileApplicantDetail";
import { BulkAction } from "@/components/wait-list/BulkAction";
import { BulkActionModal } from "@/components/wait-list/BulkActionModel";
import { FilterBuilder, type FilterCondition, type FilterGroup } from "@/components/wait-list/FilterBuilder";
import PaginationControls from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPaginationMeta } from "@/lib/pagination";
import { useWaitList } from "@/hooks/useWaitlist";
import { useIsMobile } from "@/hooks/use-mobile";

type ReportFormat = React.ComponentProps<typeof AnalyticsSection>["reportFormat"];

function asString(value: unknown) {
	if (value === null || value === undefined) return "";
	return String(value);
}

function matchesCondition(applicant: WaitListType, condition: FilterCondition) {
	const operator = condition.operator;
	const rawValue = condition.value ?? "";
	const value = rawValue.toString().trim();

	const getFieldValue = () => {
		switch (condition.field) {
			case "fullName":
				return asString(applicant.fullName);
			case "age":
				return applicant.age;
			case "status":
				return asString(applicant.currentEmploymentStatus);
			default:
				return "";
		}
	};

	const fieldValue = getFieldValue();

	// Numeric comparisons (age)
	if (condition.field === "age") {
		const numField = typeof fieldValue === "number" ? fieldValue : Number(fieldValue);
		const numValue = Number(value);
		if (!Number.isFinite(numField) || !Number.isFinite(numValue)) return false;

		if (operator === "eq") return numField === numValue;
		if (operator === "gt") return numField > numValue;
		if (operator === "lt") return numField < numValue;
		// fallback: string compare
		return false;
	}

	const left = asString(fieldValue).toLowerCase();
	const right = value.toLowerCase();

	if (operator === "eq") return left === right;
	if (operator === "contains") return right ? left.includes(right) : true;

	// Date operators aren't wired because waitlist fields here are not dates.
	if (operator === "after" || operator === "before") return false;

	// String gt/lt not supported
	return false;
}

function matchesGroup(applicant: WaitListType, group: FilterGroup): boolean {
	const conditionsOk = group.conditions.map((c) => matchesCondition(applicant, c));
	const subgroupsOk = group.groups.map((g) => matchesGroup(applicant, g));
	const results = [...conditionsOk, ...subgroupsOk];
	if (results.length === 0) return true;
	return group.logic === "and" ? results.every(Boolean) : results.some(Boolean);
}

function uniqSorted(values: Array<string | null | undefined>) {
	const set = new Set(
		values
			.map((v) => (v ?? "").toString().trim())
			.filter((v) => v.length > 0)
	);
	return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function downloadTextFile(filename: string, content: string, mime = "text/plain") {
	if (typeof window === "undefined") return;
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export default function WaitListPage() {
	const isMobile = useIsMobile();
	const [bulkFilters, setBulkFilters] = React.useState<FilterGroup | undefined>(undefined);
	const [customReportOpen, setCustomReportOpen] = React.useState(false);
	const [reportFormat, setReportFormat] = React.useState<ReportFormat>("table");
	const [page, setPage] = React.useState(1);
	const pageSize = 7;
	const [selectedFields, setSelectedFields] = React.useState<string[]>([
		"fullName",
		"email",
		"currentEmploymentStatus",
		"batch",
		"stage",
	]);
	const [, startTransition] = React.useTransition();

	const {
		data: waitListRes,
		isLoading,
		isError,
		error,
	} = WaitListApi.Get.useQuery({ page: 1, limit: 6000 });

	const allApplicants = React.useMemo(() => {
		return (waitListRes?.data ?? []) as WaitListType[];
	}, [waitListRes]);

	const applicantById = React.useMemo(() => {
		return new Map(allApplicants.map((a) => [a._id, a] as const));
	}, [allApplicants]);

	const advancedFiltered = React.useMemo(() => {
		if (!bulkFilters) return allApplicants;
		return allApplicants.filter((a) => matchesGroup(a, bulkFilters));
	}, [allApplicants, bulkFilters]);

	const {
		filteredApplicants,
		selectedApplicant,
		searchQuery,
		setSearchQuery,
		batchFilter,
		setBatchFilter,
		stageFilter,
		setStageFilter,
		setSelectedId,
		selectedId,
	} = useWaitList<WaitListType>(advancedFiltered, {
		autoSelectFirst: !isMobile,
	});

	const deferredSelectedId = React.useDeferredValue(selectedId);

	const onSelectApplicant = React.useCallback(
		(applicant: WaitListType) => {
			startTransition(() => setSelectedId(applicant._id));
		},
		[startTransition, setSelectedId]
	);

	const onSearchChange = React.useCallback(
		(value: string) => {
			startTransition(() => setSearchQuery(value));
		},
		[startTransition, setSearchQuery]
	);

	const onBatchChange = React.useCallback(
		(value: string) => {
			startTransition(() => setBatchFilter(value));
		},
		[startTransition, setBatchFilter]
	);

	const onStageChange = React.useCallback(
		(value: string) => {
			startTransition(() => setStageFilter(value));
		},
		[startTransition, setStageFilter]
	);

	const onBulkFiltersChange = React.useCallback(
		(nextFilters: FilterGroup | undefined) => {
			startTransition(() => setBulkFilters(nextFilters));
		},
		[startTransition]
	);

	const batches = React.useMemo(() => {
		return uniqSorted(allApplicants.map((a) => a.batch));
	}, [allApplicants]);

	const stageOptions = React.useMemo(
		() => [
			{ value: "rejected", label: "Rejected/Not interested" },
			{ value: "registered", label: "Registered/Pending Review" },
			{ value: "eligible", label: "Eligible" },
			{ value: "approved", label: "Approved" },
			{ value: "unable_to_reach", label: "Unable to reach" },
		],
		[]
	);

	const stageLabels = React.useMemo(
		() =>
			stageOptions.reduce<Record<string, string>>((acc, opt) => {
				acc[opt.value] = opt.label;
				return acc;
			}, {}),
		[stageOptions]
	);

	const analytics = React.useMemo(() => {
		const total = filteredApplicants.length;
		const unemployed = filteredApplicants.filter((a) =>
			asString(a.currentEmploymentStatus).toLowerCase().includes("unemployed")
		).length;
		const ages = filteredApplicants
			.map((a) => a.age)
			.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
		const avgAge = ages.length ? Math.round(ages.reduce((s, n) => s + n, 0) / ages.length) : 0;
		const hasComputer = filteredApplicants.filter((a) => Boolean(a.hasComputerAccess)).length;
		const computerAccessPercentage = total ? Math.round((hasComputer / total) * 100) : 0;

		return { total, unemployed, avgAge, computerAccessPercentage };
	}, [filteredApplicants]);

	const exportToCSV = React.useCallback(() => {
		const rows = (filteredApplicants ?? []).map((a) => {
			const rec: Record<string, string> = {};
			for (const key of selectedFields) {
				rec[key] = asString((a as unknown as Record<string, unknown>)[key]);
			}
			return rec;
		});

		const headers = selectedFields.length ? selectedFields : ["fullName", "email", "batch", "stage"];
		const csv = [
			headers.join(","),
			...rows.map((row) =>
				headers
					.map((h) => {
						const cell = row[h] ?? "";
						const escaped = String(cell).replace(/\"/g, '""');
						return `"${escaped}"`;
					})
					.join(",")
			),
		].join("\n");

		downloadTextFile(`waitlist-${Date.now()}.csv`, csv, "text/csv");
	}, [filteredApplicants, selectedFields]);

	const selectedMessage = selectedApplicant ?? null;
	const deferredSelectedMessage = React.useMemo(() => {
		if (!deferredSelectedId) return null;
		return applicantById.get(deferredSelectedId) ?? selectedMessage;
	}, [applicantById, deferredSelectedId, selectedMessage]);

	const paginationMeta = React.useMemo(
		() => getPaginationMeta(filteredApplicants.length, page, pageSize),
		[filteredApplicants.length, page, pageSize]
	);

	const pagedApplicants = React.useMemo(() => {
		return filteredApplicants.slice(
			paginationMeta.startIndex,
			paginationMeta.endIndexExclusive
		);
	}, [filteredApplicants, paginationMeta.startIndex, paginationMeta.endIndexExclusive]);

	React.useEffect(() => {
		if (paginationMeta.safePage !== page) {
			setPage(paginationMeta.safePage);
		}
	}, [paginationMeta.safePage, page]);

	React.useEffect(() => {
		if (pagedApplicants.length === 0) {
			setSelectedId(null);
			return;
		}
		if (isMobile) return;
		const inPage = pagedApplicants.some((a) => a._id === selectedId);
		if (!inPage) setSelectedId(pagedApplicants[0]._id);
	}, [pagedApplicants, selectedId, setSelectedId, isMobile]);

	React.useEffect(() => {
		setPage(1);
	}, [searchQuery, batchFilter, stageFilter, bulkFilters]);

	return (
		<div className="flex flex-col h-full bg-[#E2EDF8] min-h-screen">
			{/* Top: Analytics */}
			<div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
				<AnalyticsSection
					analytics={analytics}
					customReportOpen={customReportOpen}
					setCustomReportOpen={setCustomReportOpen}
					exportToCSV={exportToCSV}
					reportFormat={reportFormat}
					setReportFormat={setReportFormat}
					selectedFields={selectedFields}
					setSelectedFields={setSelectedFields}
					filteredMessages={filteredApplicants}
				/>
			</div>

			{/* Search & filters */}
			<header className="px-4 sm:px-6 lg:px-8 py-4 bg-white/70 backdrop-blur-sm border-b border-blue-50 sticky top-0 z-10 mx-4 sm:mx-6 lg:mx-8 rounded-t-[1.5rem] sm:rounded-t-[2rem] lg:rounded-t-[2.5rem] mt-4 sm:mt-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="text-sm font-bold text-gray-500">
						{filteredApplicants.length} applicants found
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Search */}
						<div className="relative w-full md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search name, email…"
								className="pl-9 bg-white border-none rounded-xl h-10 text-sm shadow-sm"
								value={searchQuery}
								onChange={(e) => onSearchChange(e.target.value)}
							/>
						</div>

						{/* Advanced filters */}
						<BulkActionModal>
							<FilterBuilder
								onFiltersChange={onBulkFiltersChange}
								initialFilters={bulkFilters}
							/>
						</BulkActionModal>

						{/* Bulk stage update */}
						<BulkAction
							selectedIds={filteredApplicants.map((a) => a._id)}
							totalApplicants={filteredApplicants.length}
						/>

						{/* Batch dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									className="bg-white border-none rounded-xl h-10 font-bold text-xs shadow-sm"
									type="button"
								>
									Batch: {batchFilter === "" ? "All" : batchFilter}
									<ChevronDown className="ml-2 h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="rounded-xl border-none shadow-xl">
								<DropdownMenuItem onClick={() => onBatchChange("")}>
									All Batches
								</DropdownMenuItem>
								{batches.map((b) => (
									<DropdownMenuItem key={b} onClick={() => onBatchChange(b)}>
										{b}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Stage dropdown */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												className="bg-white border-none rounded-xl h-10 font-bold text-xs shadow-sm"
												type="button"
											>
												Stage:{" "}
												{stageFilter === ""
													? "All"
													: stageLabels[stageFilter as keyof typeof stageLabels] ?? stageFilter}
												<ChevronDown className="ml-2 h-3 w-3" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="rounded-xl border-none shadow-xl">
											<DropdownMenuItem onClick={() => onStageChange("")}>All</DropdownMenuItem>
											{stageOptions.map((opt) => (
												<DropdownMenuItem
													key={opt.value}
													onClick={() => onStageChange(opt.value)}
												>
													{opt.label}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
					</div>
				</div>
			</header>

			{/* Split view */}
			<div className="flex flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 pb-6">
				<div className="flex flex-col md:flex-row w-full bg-white rounded-b-[1.5rem] sm:rounded-b-[2rem] lg:rounded-b-[2.5rem] shadow-sm overflow-hidden border border-t-0 border-blue-50">
					<ApplicantsList
						isLoading={isLoading}
						isError={isError}
						error={error}
						filteredMessages={pagedApplicants}
						selectedMessage={selectedMessage}
						handleMessageSelect={onSelectApplicant}
						page={page}
						onPageChange={setPage}
						totalItems={filteredApplicants.length}
						pageSize={pageSize}
					/>

					{!isMobile && (
						<div className={cn("flex-1", isLoading && "opacity-60")}>
							<ApplicantDetail selectedMessage={deferredSelectedMessage} />
						</div>
					)}

					{isMobile && selectedMessage && (
						<MobileApplicantDetail
							selectedMessage={selectedMessage}
							setSelectedMessage={() => startTransition(() => setSelectedId(null))}
						/>
					)}
				</div>
			</div>

		</div>
	);
}

