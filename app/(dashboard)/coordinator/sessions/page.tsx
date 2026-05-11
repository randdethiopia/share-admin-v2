"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TrainingSessionApi, {
	type TrainingSessionRow,
	type TrainingSessionStatus,
} from "@/lib/api/training-session";
import PaginationControls from "@/components/shared/PaginationControls";
import { CoordinatorScopePicker } from "@/components/coordinator/CoordinatorScopePicker";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useCoordinatorScope } from "@/hooks/use-coordinator-scope";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import type { ErrorRes } from "@/types/core";
import { AxiosError } from "axios";
import { CalendarDays, Loader2, Search, UserPlus } from "lucide-react";

type StatusFilter = "all" | TrainingSessionStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
	{ value: "all", label: "All statuses" },
	{ value: "draft", label: "Draft" },
	{ value: "scheduled", label: "Scheduled" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
];

function formatScheduledAt(iso: string) {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function formatStatusLabel(status: string) {
	const s = status.trim();
	if (!s) return "—";
	return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function statusBadgeClass(status: string) {
	const s = status.toLowerCase();
	if (s === "scheduled") return "bg-sky-100 text-sky-800";
	if (s === "draft") return "bg-slate-100 text-slate-700";
	if (s === "completed") return "bg-emerald-100 text-emerald-800";
	if (s === "cancelled") return "bg-red-50 text-red-700";
	return "bg-slate-100 text-slate-600";
}

function SessionsEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-slate-500">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
				<CalendarDays className="h-6 w-6" />
			</div>
			<p className="text-sm font-medium text-slate-700">No training sessions</p>
			<p className="max-w-sm text-xs text-slate-500">
				Try another coordinator scope, adjust filters, or create a new session from
				My trainees.
			</p>
		</div>
	);
}

function SessionsFiltersToolbar({
	searchInput,
	setSearchInput,
	status,
	setStatus,
	setPage,
	pageSize,
	setPageSize,
	onlyMine,
	setOnlyMine,
	accountId,
	showOnlyMine,
}: {
	searchInput: string;
	setSearchInput: (v: string) => void;
	status: StatusFilter;
	setStatus: (v: StatusFilter) => void;
	setPage: (n: number) => void;
	pageSize: number;
	setPageSize: (n: number) => void;
	onlyMine: boolean;
	setOnlyMine: (v: boolean) => void;
	accountId: string | null | undefined;
	showOnlyMine: boolean;
}) {
	return (
		<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-4 lg:gap-y-3">
			<div className="relative w-full min-w-0 flex-1 max-w-md">
				<Label
					htmlFor="sessions-search"
					className="mb-1.5 ml-0.5 block text-xs font-medium text-muted-foreground"
				>
					Search
				</Label>
				<div className="relative">
					<Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="sessions-search"
						placeholder="Search by title…"
						className="h-11 rounded-xl border-slate-200 bg-slate-50/90 pl-10 shadow-sm"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
				</div>
			</div>

			<div className="flex flex-wrap items-end gap-3 sm:gap-4">
				<div className="w-[10.5rem] min-w-0 sm:w-44">
					<Label
						htmlFor="sessions-status"
						className="mb-1.5 ml-0.5 block text-xs font-medium text-muted-foreground"
					>
						Status
					</Label>
					<Select
						value={status}
						onValueChange={(v) => {
							setStatus(v as StatusFilter);
							setPage(1);
						}}
					>
						<SelectTrigger
							id="sessions-status"
							className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm"
						>
							<SelectValue placeholder="All statuses" />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="w-[10.5rem] min-w-0 sm:w-36">
					<Label
						htmlFor="sessions-page-size"
						className="mb-1.5 ml-0.5 block text-xs font-medium text-muted-foreground"
					>
						Rows per page
					</Label>
					<Select
						value={String(pageSize)}
						onValueChange={(v) => {
							const n = Number(v);
							setPageSize(Number.isFinite(n) && n > 0 ? n : 10);
							setPage(1);
						}}
					>
						<SelectTrigger
							id="sessions-page-size"
							className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10</SelectItem>
							<SelectItem value="20">20</SelectItem>
							<SelectItem value="50">50</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{showOnlyMine && accountId ? (
					<div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 sm:min-h-11">
						<Checkbox
							id="only-mine"
							checked={onlyMine}
							onCheckedChange={(c) => {
								setOnlyMine(c === true);
								setPage(1);
							}}
						/>
						<Label
							htmlFor="only-mine"
							className="cursor-pointer text-sm font-medium text-slate-700"
						>
							Only my sessions
						</Label>
					</div>
				) : null}
			</div>
		</div>
	);
}

function SessionsListBody({
	isLoading,
	isError,
	rows,
}: {
	isLoading: boolean;
	isError: boolean;
	rows: TrainingSessionRow[];
}) {
	return (
		<>
			<div className="md:hidden space-y-3">
				{isLoading ? (
					<div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm text-slate-600 shadow-sm">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading…
					</div>
				) : rows.length === 0 ? (
					<div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
						<SessionsEmptyState />
					</div>
				) : (
					rows.map((row) => (
						<div
							key={row._id}
							className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
						>
							<div className="font-semibold text-slate-900">
								<Link
									href={`/coordinator/sessions/${encodeURIComponent(row._id)}`}
									className="hover:text-sky-800 hover:underline"
								>
									{row.title}
								</Link>
							</div>
							<div className="mt-1 text-xs tabular-nums text-slate-600">
								{formatScheduledAt(row.scheduledAt)}
							</div>
							<div className="mt-2 flex flex-wrap gap-2">
								<span
									className={cn(
										"rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
										statusBadgeClass(row.status)
									)}
								>
									{formatStatusLabel(String(row.status))}
								</span>
								{row.location ? (
									<span className="text-xs text-slate-500">{row.location}</span>
								) : null}
							</div>
							<Button
								variant="outline"
								size="sm"
								className="mt-3 h-9 gap-1.5 rounded-lg border-slate-200"
								asChild
							>
								<Link
									href={`/coordinator/sessions/${encodeURIComponent(row._id)}/assign`}
									onClick={(e) => e.stopPropagation()}
								>
									<UserPlus className="h-3.5 w-3.5" />
									Assign trainees
								</Link>
							</Button>
						</div>
					))
				)}
			</div>

			<div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<Table className="min-w-200">
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Title
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Scheduled
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Status
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Location
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-40 text-center text-sm text-slate-600"
									>
										<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
										Loading sessions…
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-32 text-center text-sm text-slate-500"
									>
										Could not load sessions. See the message above.
									</TableCell>
								</TableRow>
							) : rows.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-auto py-8">
										<SessionsEmptyState />
									</TableCell>
								</TableRow>
							) : (
								rows.map((row) => (
									<TableRow
										key={row._id}
										className="border-slate-100 transition-colors hover:bg-slate-50/80"
									>
										<TableCell className="px-6 py-4 sm:px-8">
											<Link
												href={`/coordinator/sessions/${encodeURIComponent(row._id)}`}
												className="line-clamp-2 text-left text-sm font-semibold text-slate-900 hover:text-sky-800 hover:underline"
											>
												{row.title}
											</Link>
										</TableCell>
										<TableCell className="px-6 py-4 text-sm tabular-nums text-slate-600 sm:px-8">
											{formatScheduledAt(row.scheduledAt)}
										</TableCell>
										<TableCell className="px-6 py-4 sm:px-8">
											<span
												className={cn(
													"inline-flex rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide",
													statusBadgeClass(row.status)
												)}
											>
												{formatStatusLabel(String(row.status))}
											</span>
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8">
											{row.location ?? "—"}
										</TableCell>
										<TableCell className="px-6 py-4 sm:px-8">
											<Button
												variant="outline"
												size="sm"
												className="h-9 gap-1.5 rounded-lg border-slate-200"
												asChild
											>
												<Link
													href={`/coordinator/sessions/${encodeURIComponent(row._id)}/assign`}
													onClick={(e) => e.stopPropagation()}
												>
													<UserPlus className="h-3.5 w-3.5" />
													Assign trainees
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</>
	);
}

export default function TrainingSessionsListPage() {
	const accountId = useAuthStore((s) => s._id);
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const {
		isPickerMode,
		effectiveCoordinatorId,
		canScopeTraineeFetch,
		selectedCoordinatorId,
		setSelectedCoordinatorId,
		coordinators,
		isCoordinatorListLoading,
		isCoordinatorListError,
	} = useCoordinatorScope();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	// Coordinators should only ever see their own sessions.
	const [onlyMine, setOnlyMine] = useState(true);

	useEffect(() => {
		const t = setTimeout(() => {
			setSearch(searchInput);
			setPage(1);
		}, 400);
		return () => clearTimeout(t);
	}, [searchInput]);

	const statusParam = useMemo(
		() => (status === "all" ? undefined : status),
		[status]
	);

	const coordinatorIdParam = useMemo(() => {
		if (isPickerMode) {
			const id = effectiveCoordinatorId.trim();
			return id || undefined;
		}
		// Non-picker mode (coordinator-like): always scope to the logged-in account.
		if (!accountId) return undefined;
		return accountId;
	}, [isPickerMode, effectiveCoordinatorId, accountId]);

	const queryFilters = useMemo(
		() => ({
			page,
			limit: pageSize,
			...(coordinatorIdParam ? { coordinatorId: coordinatorIdParam } : {}),
			...(statusParam ? { status: statusParam } : {}),
			...(search.trim() ? { search: search.trim() } : {}),
		}),
		[page, pageSize, coordinatorIdParam, statusParam, search]
	);

	const canFetchSessions =
		hasHydrated && (isPickerMode ? canScopeTraineeFetch : true);

	const { data, isLoading, isError, error } =
		TrainingSessionApi.GetList.useQuery(queryFilters, {
			enabled: canFetchSessions,
		});

	const rows: TrainingSessionRow[] = data?.data ?? [];
	const totalItems = data?.meta?.totalItems ?? 0;

	const errorMessage =
		isError && error instanceof AxiosError
			? (error.response?.data as ErrorRes | undefined)?.message ||
				"Failed to load training sessions."
			: null;

	const filtersProps = {
		searchInput,
		setSearchInput,
		status,
		setStatus,
		setPage,
		pageSize,
		setPageSize,
		onlyMine,
		setOnlyMine,
		accountId,
	};

	return (
		<div className="space-y-8 px-4 sm:px-0">
			<div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
				<div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
				<div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl" />
				<div className="relative space-y-2">
					<h1 className="text-[28px] font-bold tracking-tight text-slate-900">
						Training sessions
					</h1>
					<p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
						View and filter training sessions. Newest scheduled times appear first
						(per server ordering).
					</p>
				</div>
			</div>

			<div className="rounded-[2rem] border border-blue-50/80 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
				{!hasHydrated ? (
					<div className="flex items-center gap-2 rounded-2xl border border-gray-100 p-6 text-sm text-slate-600">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading session…
					</div>
				) : isPickerMode ? (
					<>
						<Card className="mb-6 gap-0 border-slate-200/80 py-0 shadow-sm">
							<CardHeader className="space-y-1.5 px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
								<CardTitle className="text-base text-slate-900">
									Session list scope
								</CardTitle>
								<CardDescription className="text-pretty">
									Choose which coordinator&apos;s training sessions appear in the table
									below. The same selection is used on other coordinator pages until
									you change it.
								</CardDescription>
							</CardHeader>
							<CardContent className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-6 sm:pb-5">
								<CoordinatorScopePicker
									coordinators={coordinators}
									value={selectedCoordinatorId}
									onValueChange={setSelectedCoordinatorId}
									isLoading={isCoordinatorListLoading}
									isError={isCoordinatorListError}
									id="training-sessions-coordinator-scope"
								/>
							</CardContent>
						</Card>
						{!selectedCoordinatorId.trim() ? (
							<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
								Select a coordinator above to load their training sessions.
							</div>
						) : (
							<>
								<SessionsFiltersToolbar
									{...filtersProps}
									showOnlyMine={false}
								/>
								{errorMessage ? (
									<div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
										{errorMessage}
									</div>
								) : null}
								<SessionsListBody
									isLoading={isLoading}
									isError={isError}
									rows={rows}
								/>
								<PaginationControls
									className="mt-6"
									page={page}
									onPageChange={setPage}
									totalItems={totalItems}
									pageSize={pageSize}
									disabled={isLoading || isError}
								/>
							</>
						)}
					</>
				) : (
					<>
						<SessionsFiltersToolbar {...filtersProps} showOnlyMine={false} />
						{errorMessage ? (
							<div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
								{errorMessage}
							</div>
						) : null}
						<SessionsListBody
							isLoading={isLoading}
							isError={isError}
							rows={rows}
						/>
						<PaginationControls
							className="mt-6"
							page={page}
							onPageChange={setPage}
							totalItems={totalItems}
							pageSize={pageSize}
							disabled={isLoading || isError}
						/>
					</>
				)}
			</div>
		</div>
	);
}
