"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import TrainingSessionApi, {
	type SessionEnrollmentRow,
	type SessionEnrollmentTraineeRef,
} from "@/api/training-session";
import PaginationControls from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import useAuthStore from "@/store/useAuthStore";
import type { ErrorRes } from "@/types/core";
import { AxiosError } from "axios";
import { ArrowLeft, Loader2, Search, UserPlus } from "lucide-react";

type AttendanceFilter = "all" | "attended" | "absent";

function formatDt(iso: string | undefined) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function resolveTraineeFromRow(
	traineeId: SessionEnrollmentRow["traineeId"]
): SessionEnrollmentTraineeRef | null {
	if (traineeId && typeof traineeId === "object") {
		return traineeId as SessionEnrollmentTraineeRef;
	}
	return null;
}

function resolveTraineeName(traineeId: SessionEnrollmentRow["traineeId"]) {
	const t = resolveTraineeFromRow(traineeId);
	if (t) {
		const name = `${t.firstname ?? ""} ${t.lastname ?? ""}`.trim();
		return name || t.email || "—";
	}
	if (typeof traineeId === "string" && traineeId.trim()) return traineeId;
	return "—";
}

function resolveTraineeEmail(traineeId: SessionEnrollmentRow["traineeId"]) {
	const t = resolveTraineeFromRow(traineeId);
	return t?.email ?? "—";
}

function resolveTraineePhone(traineeId: SessionEnrollmentRow["traineeId"]) {
	const t = resolveTraineeFromRow(traineeId);
	return t?.phoneNumber ?? "—";
}

function resolveEnrollmentsError(error: unknown): {
	message: string;
	hint?: string;
} {
	const ax = error as AxiosError<ErrorRes>;
	const status = ax.response?.status;
	const raw = ax.response?.data?.message;

	if (status === 404) {
		return {
			message: raw || "This training session was not found.",
		};
	}
	if (status === 400) {
		return {
			message: raw || "Invalid session id.",
			hint: "Check that the link uses a valid session id.",
		};
	}
	if (status === 403) {
		return {
			message: raw || "You do not have permission to view these enrollments.",
		};
	}
	return {
		message: raw || "Failed to load enrollments.",
	};
}

function serverStatusIsAttended(status: string | undefined) {
	const s = (status ?? "").trim().toLowerCase();
	return s === "attended";
}

export default function TrainingSessionDetailPage() {
	const params = useParams();
	const sessionId =
		typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

	const hasHydrated = useAuthStore((s) => s.hasHydrated);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchInput, setSearchInput] = useState("");
	const [attendanceFilter, setAttendanceFilter] =
		useState<AttendanceFilter>("all");
	const [attendanceLocal, setAttendanceLocal] = useState<
		Record<string, boolean>
	>({});

	const searchQuery = searchInput.trim();
	const lastSearchTrimRef = useRef("");

	const attendanceParam = useMemo(
		() =>
			attendanceFilter === "all" ? undefined : attendanceFilter,
		[attendanceFilter]
	);

	const queryFilters = useMemo(
		() => ({
			page,
			limit: pageSize,
			...(attendanceParam ? { attendanceStatus: attendanceParam } : {}),
			...(searchQuery ? { search: searchQuery } : {}),
		}),
		[page, pageSize, attendanceParam, searchQuery]
	);

	const {
		data,
		isLoading,
		isError,
		error,
		refetch,
		isFetching,
	} = TrainingSessionApi.GetEnrollments.useQuery(sessionId, queryFilters, {
		enabled: hasHydrated && Boolean(sessionId.trim()),
	});

	const rows: SessionEnrollmentRow[] = data?.data ?? [];
	const totalItems = data?.meta?.totalItems ?? 0;

	const errorCopy = isError ? resolveEnrollmentsError(error) : null;

	const idPreview =
		sessionId.length > 18
			? `${sessionId.slice(0, 10)}…${sessionId.slice(-6)}`
			: sessionId || "—";

	useEffect(() => {
		startTransition(() => {
			setAttendanceLocal({});
		});
	}, [sessionId]);

	return (
		<div className="space-y-6 px-4 sm:px-0">
			<div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
				<div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
				<div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl" />
				<div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-2">
						<Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1" asChild>
							<Link href="/coordinator/sessions">
								<ArrowLeft className="h-4 w-4" />
								Back to sessions
							</Link>
						</Button>
						<h1 className="text-[28px] font-bold tracking-tight text-slate-900">
							Session enrollments
						</h1>
						<p className="max-w-2xl text-sm font-medium text-slate-600">
							Trainees enrolled in session{" "}
							<span className="font-mono text-slate-800">{idPreview}</span>. Newest
							enrollments first (per server).
						</p>
					</div>
					
				</div>
			</div>

			<div className="rounded-[2rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
				{!hasHydrated ? (
					<div className="flex items-center gap-2 rounded-2xl border border-gray-100 p-6 text-sm text-slate-600">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading…
					</div>
				) : !sessionId.trim() ? (
					<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
						Missing session id in the URL.
					</div>
				) : (
					<>
						<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
							<div className="relative w-full max-w-sm">
								<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
								<Input
									placeholder="Search name, email, phone…"
									className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11"
									value={searchInput}
									onChange={(e) => {
										const value = e.target.value;
										const nextTrim = value.trim();
										if (lastSearchTrimRef.current !== nextTrim) {
											lastSearchTrimRef.current = nextTrim;
											setPage(1);
										}
										setSearchInput(value);
									}}
								/>
							</div>
							<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
								<div className="w-full sm:w-44">
									<label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-gray-400">
										Attendance
									</label>
									<Select
										value={attendanceFilter}
										onValueChange={(v) => {
											if (
												v === "all" ||
												v === "attended" ||
												v === "absent"
											) {
												setAttendanceFilter(v);
												setPage(1);
											}
										}}
									>
										<SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All</SelectItem>
											<SelectItem value="attended">Attended</SelectItem>
											<SelectItem value="absent">Absent</SelectItem>
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
							</div>
						</div>

						{errorCopy ? (
							<div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
								<p>{errorCopy.message}</p>
								{errorCopy.hint ? (
									<p className="mt-2 text-red-700/90">{errorCopy.hint}</p>
								) : null}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-3 border-red-200"
									onClick={() => refetch()}
								>
									Retry
								</Button>
							</div>
						) : null}

						<div className="overflow-x-auto rounded-2xl border border-gray-100">
							<Table className="min-w-200">
								<TableHeader className="bg-[#D6E6F2]">
									<TableRow className="border-none hover:bg-transparent">
										<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
											Name
										</TableHead>
										<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
											Email
										</TableHead>
										<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
											Phone
										</TableHead>
										<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
											Attended at
										</TableHead>
										<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
											Note
										</TableHead>
										<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
											Enrolled at
										</TableHead>
										<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
											Attended
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className="h-40 text-center text-sm text-slate-600"
											>
												<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
												Loading enrollments…
											</TableCell>
										</TableRow>
									) : isError ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className="h-32 text-center text-sm text-slate-500"
											>
												Could not load enrollments. Use retry above.
											</TableCell>
										</TableRow>
									) : rows.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={7}
												className="h-32 text-center text-sm text-slate-500"
											>
												{isFetching
													? "Updating…"
													: "No enrollments match your filters."}
											</TableCell>
										</TableRow>
									) : (
										rows.map((row) => (
											<TableRow
												key={row._id}
												className="border-gray-50 hover:bg-slate-50/50"
											>
												<TableCell className="px-6 py-4 font-semibold text-slate-900 sm:px-8">
													{resolveTraineeName(row.traineeId)}
												</TableCell>
												<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8">
													{resolveTraineeEmail(row.traineeId)}
												</TableCell>
												<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8">
													{resolveTraineePhone(row.traineeId)}
												</TableCell>
												<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8">
													{formatDt(row.attendedAt)}
												</TableCell>
												<TableCell className="max-w-48 truncate px-6 py-4 text-sm text-slate-600 sm:px-8">
													{row.note ?? "—"}
												</TableCell>
												<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8">
													{formatDt(row.createdAt)}
												</TableCell>
												<TableCell className="px-6 py-4 sm:px-8">
													<Checkbox
														checked={
															row._id in attendanceLocal
																? attendanceLocal[row._id]
																: serverStatusIsAttended(
																		row.attendanceStatus
																	)
														}
														onCheckedChange={(c) => {
															setAttendanceLocal((prev) => ({
																...prev,
																[row._id]: c === true,
															}));
														}}
														aria-label={`Mark ${resolveTraineeName(row.traineeId)} as attended`}
													/>
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
