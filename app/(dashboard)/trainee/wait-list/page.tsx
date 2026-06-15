"use client";

import * as React from "react";
import { ChevronDown, Loader2, Search, SlidersHorizontal } from "lucide-react";
import api, { getWaitListServerSideFn } from "@/lib/api";
import { formatEmploymentStatus } from "@/lib/api/applicantLabels";

import { AnalyticsSection } from "@/components/wait-list/analyticsSection";
import { ApplicantsList } from "@/components/wait-list/ApplicantsList";
import { ApplicantDetail } from "@/components/wait-list/ApplicantDetail";
import { MobileApplicantDetail } from "@/components/wait-list/MobileApplicantDetail";
import { BulkAction } from "@/components/wait-list/BulkAction";
import { BulkActionModal } from "@/components/wait-list/BulkActionModel";
import { FilterBuilder, type FilterCondition, type FilterGroup } from "@/components/wait-list/FilterBuilder";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { ApplicantListItem } from "@/lib/api/waitlist";
import { getApplicantFullName } from "@/lib/applicantName";


type ReportFormat = React.ComponentProps<typeof AnalyticsSection>["reportFormat"];

const DEFAULT_REPORT_FIELDS = [
	"firstName",
	"middleName",
	"lastName",
	"email",
	"phoneNumber",
	"gender",
	"region",
	"city",
	"subcity",
	"woreda",
	"employmentStatus",
	"batch",
	"stage",
] as const;

function asString(value: unknown) {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) return value.join(", ");
	if (typeof value === "object") {
		const o = value as Record<string, unknown>;
		if (typeof o.name === "string") return o.name;
		return JSON.stringify(value);
	}
	return String(value);
}

function matchesCondition(applicant: ApplicantListItem, condition: FilterCondition) {
	const operator = condition.operator;
	const rawValue = condition.value ?? "";
	const value = rawValue.toString().trim();

	if (condition.field === "city") {
		if (!value) return true;
		if (applicant.city?._id !== value) return false;
		const subId = condition.subValue?.trim();
		if (!subId) return true;
		return applicant.subcity?._id === subId;
	}

	if (condition.field === "gender") {
		if (!value) return true;
		return applicant.gender === value;
	}

	const getFieldValue = (): string | number => {
		switch (condition.field) {
			case "fullName":
				return getApplicantFullName(applicant);
			case "age":
				return applicant.age;
			case "status":
				// Match against both the code and the readable label so the user
				// can type either "UNE" or "unemployed".
				return [
					applicant.employmentStatus,
					formatEmploymentStatus(applicant.employmentStatus),
				]
					.filter(Boolean)
					.join(" ");
			case "zone":
				return applicant.zone;
			case "region":
				return applicant.region;
			case "woreda":
				return applicant.woreda;
			case "phoneNumber":
				return applicant.phoneNumber;
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
		return false;
	}

	const left = asString(fieldValue).toLowerCase();
	const right = value.toLowerCase();

	if (condition.field === "phoneNumber") {
		const phoneDigits = asString(fieldValue).replace(/\D/g, "");
		const queryDigits = value.replace(/\D/g, "");
		if (operator === "eq") {
			return queryDigits
				? phoneDigits === queryDigits
				: left === right;
		}
		if (operator === "contains") {
			return queryDigits
				? phoneDigits.includes(queryDigits)
				: right
					? left.includes(right)
					: true;
		}
		return false;
	}

	if (operator === "eq") return left === right;
	if (operator === "contains") return right ? left.includes(right) : true;

	// Date operators aren't wired because waitlist fields here are not dates.
	if (operator === "after" || operator === "before") return false;

	// String gt/lt not supported
	return false;
}

function matchesGroup(applicant: ApplicantListItem, group: FilterGroup): boolean {
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
	const [bulkFilterModalOpen, setBulkFilterModalOpen] = React.useState(false);
	const [customReportOpen, setCustomReportOpen] = React.useState(false);
	const [reportFormat, setReportFormat] = React.useState<ReportFormat>("table");
	const [serverFilterModalOpen, setServerFilterModalOpen] = React.useState(false);
	const [serverAge, setServerAge] = React.useState("");
	const [serverGender, setServerGender] = React.useState("");
	const [serverRegion, setServerRegion] = React.useState("");
	const [isServerFiltering, setIsServerFiltering] = React.useState(false);
	const [page, setPage] = React.useState(1);
	const pageSize = 7;
	const [selectedFields, setSelectedFields] = React.useState<string[]>([
		...DEFAULT_REPORT_FIELDS,
	]);
	const [, startTransition] = React.useTransition();

	const {
		data: waitListRes,
		isLoading,
		isError,
		error,
	} = api.WaitList.Get.useQuery({ page: 1, limit: 6000 });

	const allApplicants = React.useMemo<ApplicantListItem[]>(() => {
		return waitListRes?.data ?? [];
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
	} = useWaitList<ApplicantListItem>(advancedFiltered, {
		autoSelectFirst: !isMobile,
	});

	const deferredSelectedId = React.useDeferredValue(selectedId);

	const onSelectApplicant = React.useCallback(
		(applicant: ApplicantListItem) => {
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

	const handleServerFilter = React.useCallback(async () => {
		const ageNumber = serverAge.trim() ? Number(serverAge.trim()) : undefined;
		const payload = {
			age: Number.isFinite(ageNumber) ? ageNumber : undefined,
			gender: serverGender.trim() || undefined,
			region: serverRegion.trim() || undefined,
		};
		const toastId = toast.loading("Applying API filters...");

		try {
			setIsServerFiltering(true);
			const result = await getWaitListServerSideFn(payload);
			toast.dismiss(toastId);
			toast.success(
				`Filter completed successfully. ${result.data?.length ?? 0} applicant(s) returned.`
			);
			setServerFilterModalOpen(false);
		} catch (err) {
			toast.dismiss(toastId);
			const message =
				typeof err === "object" && err !== null && "response" in err
					? (err as { response?: { data?: { message?: string } } }).response?.data
						?.message
					: undefined;
			toast.error(message || "Filtering failed. Please try again.");
		} finally {
			setIsServerFiltering(false);
		}
	}, [serverAge, serverGender, serverRegion]);

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
		const unemployed = filteredApplicants.filter(
			(a) => a.employmentStatus === "UNE"
		).length;
		const ages = filteredApplicants
			.map((a) => a.age)
			.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
		const avgAge = ages.length ? Math.round(ages.reduce((s, n) => s + n, 0) / ages.length) : 0;
		const hasComputer = filteredApplicants.filter((a) =>
			Array.isArray(a.digitalDevices) && a.digitalDevices.includes("LAP")
		).length;
		const computerAccessPercentage = total ? Math.round((hasComputer / total) * 100) : 0;

		return { total, unemployed, avgAge, computerAccessPercentage };
	}, [filteredApplicants]);

	const exportToCSV = React.useCallback(() => {
		const csv = exportApplicantsToDefaultCsv(filteredApplicants ?? []);
		downloadTextFile(`waitlist-${Date.now()}.csv`, csv, "text/csv");
	}, [filteredApplicants]);

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
		<div className="flex flex-col h-full min-h-screen">
			{/* Top: Analytics */}
			<div className="px-4 py-6">
				<AnalyticsSection
					analytics={analytics}
					customReportOpen={customReportOpen}
					setCustomReportOpen={setCustomReportOpen}
					exportToCSV={exportToCSV}
					reportFormat={reportFormat}
					setReportFormat={setReportFormat}
					selectedFields={selectedFields}
					setSelectedFields={setSelectedFields}
					
				/>
			</div>

			{/* Search & filters */}
			<header className="top-0 z-10 mt-4 w-full min-w-0 rounded-t-[1.5rem] border border-b-0 border-blue-50 bg-white px-4 py-4 shadow-sm sm:mt-6 sm:rounded-t-[2rem] sm:px-6 lg:rounded-t-[2.5rem] lg:px-8">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="text-sm font-bold text-gray-500">
						{filteredApplicants.length} applicants found
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{/* Search */}
						<div className="relative w-full md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search name, email, phone…"
								className="pl-9 bg-white border-none rounded-xl h-10 text-sm shadow-sm"
								value={searchQuery}
								onChange={(e) => onSearchChange(e.target.value)}
							/>
						</div>

						{/* Advanced filters */}
						<BulkActionModal
							open={bulkFilterModalOpen}
							onOpenChange={setBulkFilterModalOpen}
						>
							<FilterBuilder
								onFiltersChange={onBulkFiltersChange}
								initialFilters={bulkFilters}
								onApply={() => setBulkFilterModalOpen(false)}
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

						{/* <Button
							type="button"
							variant="outline"
							onClick={() => setServerFilterModalOpen(true)}
							className="h-10 rounded-xl border-none bg-white text-xs font-bold shadow-sm"
						>
							<SlidersHorizontal className="mr-2 h-4 w-4" />
							BUlk Filters
						</Button> */}
					</div>
				</div>
			</header>

			{/* Split view */}
			<div className="flex min-w-0 flex-1">
				<div className="flex w-full min-w-0 flex-col overflow-hidden rounded-b-[1.5rem] border border-t-0 border-blue-50 bg-white shadow-sm sm:rounded-b-[2rem] md:flex-row lg:rounded-b-[2.5rem]">
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

			<Dialog open={serverFilterModalOpen} onOpenChange={setServerFilterModalOpen}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>API Filters</DialogTitle>
						<DialogDescription>
							Filter applicants from backend by age, gender, and region.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-3 sm:grid-cols-3">
						<Input
							type="number"
							min={0}
							placeholder="Age"
							value={serverAge}
							onChange={(e) => setServerAge(e.target.value)}
						/>
						<Input
							placeholder="Gender (male/female)"
							value={serverGender}
							onChange={(e) => setServerGender(e.target.value)}
						/>
						<Input
							placeholder="Region"
							value={serverRegion}
							onChange={(e) => setServerRegion(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setServerFilterModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleServerFilter}
							disabled={isServerFiltering}
							className="bg-blue-600 text-white hover:bg-blue-700"
						>
							{isServerFiltering ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Filtering...
								</>
							) : (
								"Filter"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

		</div>
	);
}
