"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TrainingSessionApi, {
	type TrainingSessionRow,
	type TrainingSessionStatus,
} from "@/lib/api/training-session";
import PaginationControls from "@/components/shared/PaginationControls";
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
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import type { ErrorRes } from "@/types/core";
import { AxiosError } from "axios";
import { Loader2, Search, UserPlus } from "lucide-react";

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

function statusBadgeClass(status: string) {
	const s = status.toLowerCase();
	if (s === "scheduled") return "bg-sky-100 text-sky-800";
	if (s === "draft") return "bg-slate-100 text-slate-700";
	if (s === "completed") return "bg-emerald-100 text-emerald-800";
	if (s === "cancelled") return "bg-red-50 text-red-700";
	return "bg-slate-100 text-slate-600";
}

export default function TrainingSessionsListPage() {
	const accountId = useAuthStore((s) => s._id);
	const hasHydrated = useAuthStore((s) => s.hasHydrated);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [onlyMine, setOnlyMine] = useState(false);

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
		if (!onlyMine || !accountId) return undefined;
		return accountId;
	}, [onlyMine, accountId]);

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

	const { data, isLoading, isError, error } =
		TrainingSessionApi.GetList.useQuery(queryFilters, {
			enabled: hasHydrated,
		});

	const rows: TrainingSessionRow[] = data?.data ?? [];
	const totalItems = data?.meta?.totalItems ?? 0;

	const errorMessage =
		isError && error instanceof AxiosError
			? (error.response?.data as ErrorRes | undefined)?.message ||
				"Failed to load training sessions."
			: null;

	return (
		<div className="space-y-6 px-4 sm:px-0">
			<div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
				<div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
				<div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl" />
				<div className="relative space-y-2">
					<h1 className="text-[28px] font-bold tracking-tight text-slate-900">
						Training sessions
					</h1>
					<p className="max-w-2xl text-sm font-medium text-slate-600">
						View and filter training sessions. Newest scheduled times appear first
						(per server ordering).
					</p>
				</div>
			</div>

			<div className="rounded-[2rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
				{!hasHydrated ? (
					<div className="flex items-center gap-2 rounded-2xl border border-gray-100 p-6 text-sm text-slate-600">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading session…
					</div>
				) : (
					<>
						<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
							<div className="relative w-full max-w-sm">
								<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
								<Input
									placeholder="Search by title…"
									className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11"
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
								/>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
								<div className="w-full sm:w-44">
									<label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-gray-400">
										Status
									</label>
									<Select
										value={status}
										onValueChange={(v) => {
											setStatus(v as StatusFilter);
											setPage(1);
										}}
									>
										<SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
											<SelectValue />
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

								<div className="w-full sm:w-40">
									<label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-gray-400">
										Rows per page
									</label>
									<Select
										value={String(pageSize)}
										onValueChange={(v) => {
											const n = Number(v);
											setPageSize(Number.isFinite(n) && n > 0 ? n : 10);
											setPage(1);
										}}
									>
										<SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="10">10</SelectItem>
											<SelectItem value="20">20</SelectItem>
											<SelectItem value="50">50</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{accountId ? (
									<div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:h-auto sm:min-h-11 sm:py-2">
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

						{errorMessage ? (
							<div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
								{errorMessage}
							</div>
						) : null}

						<div className="md:hidden space-y-3">
							{isLoading ? (
								<div className="flex items-center gap-2 rounded-2xl border border-gray-100 p-4 text-sm text-slate-600">
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading…
								</div>
							) : rows.length === 0 ? (
								<div className="rounded-2xl border border-gray-100 p-4 text-sm text-slate-600">
									No training sessions found.
								</div>
							) : (
								rows.map((row) => (
									<div
										key={row._id}
										className="rounded-2xl border border-gray-100 bg-white p-4"
									>
										<div className="font-bold text-slate-900">
											<Link
												href={`/coordinator/sessions/${encodeURIComponent(row._id)}`}
												className="hover:text-sky-800 hover:underline"
											>
												{row.title}
											</Link>
										</div>
										<div className="mt-1 text-xs text-slate-600">
											{formatScheduledAt(row.scheduledAt)}
										</div>
										<div className="mt-2 flex flex-wrap gap-2">
											<span
												className={cn(
													"rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
													statusBadgeClass(row.status)
												)}
											>
												{row.status}
											</span>
											{row.location ? (
												<span className="text-xs text-slate-500">{row.location}</span>
											) : null}
										</div>
										<Link
											href={`/coordinator/sessions/${encodeURIComponent(row._id)}/assign`}
											onClick={(e) => e.stopPropagation()}
											className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline"
										>
											<UserPlus className="h-4 w-4" />
											Assign trainees
										</Link>
									</div>
								))
							)}
						</div>

						<div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
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
											<TableCell colSpan={5} className="h-40 text-center text-sm text-slate-600">
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
											<TableCell
												colSpan={5}
												className="h-32 text-center text-sm text-slate-500"
											>
												No training sessions found.
											</TableCell>
										</TableRow>
									) : (
										rows.map((row) => (
											<TableRow
												key={row._id}
												className="border-gray-50 hover:bg-slate-50/50"
											>
												<TableCell className="px-6 py-4 font-bold text-gray-800 sm:px-8">
													<Link
														href={`/coordinator/sessions/${encodeURIComponent(row._id)}`}
														className="line-clamp-2 text-left hover:text-sky-800 hover:underline"
													>
														{row.title}
													</Link>
												</TableCell>
												<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8">
													{formatScheduledAt(row.scheduledAt)}
												</TableCell>
												<TableCell className="px-6 py-4 sm:px-8">
													<span
														className={cn(
															"inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase",
															statusBadgeClass(row.status)
														)}
													>
														{row.status}
													</span>
												</TableCell>
												<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8">
													{row.location ?? "—"}
												</TableCell>
												<TableCell className="px-6 py-4 sm:px-8">
													<Link
														href={`/coordinator/sessions/${encodeURIComponent(row._id)}/assign`}
														onClick={(e) => e.stopPropagation()}
														className="inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-sky-700 hover:text-sky-900 hover:underline"
													>
														<UserPlus className="h-4 w-4" />
														Assign trainees
													</Link>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>

						<PaginationControls
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
