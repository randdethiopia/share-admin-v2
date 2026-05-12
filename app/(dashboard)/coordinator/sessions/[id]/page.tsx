"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import TrainingSessionApi, {
	type SessionEnrollmentRow,
	type SessionEnrollmentTraineeRef,
	trainingSessionErrorMessage,
	trainingSessionRowFromDetailApi,
} from "@/lib/api/training-session";
import SessionAttendanceReportSheet from "@/components/coordinator/SessionAttendanceReportSheet";
import PaginationControls from "@/components/shared/PaginationControls";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, FileBarChart, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

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

function resolveTraineeId(row: SessionEnrollmentRow): string | null {
	const t = row.traineeId;
	if (t && typeof t === "object" && "_id" in t) {
		const id = (t as SessionEnrollmentTraineeRef)._id;
		if (typeof id === "string" && id.trim()) return id.trim();
	}
	if (typeof t === "string" && t.trim()) return t.trim();
	return null;
}

function isServerAttended(row: SessionEnrollmentRow) {
	const s = (row.attendanceStatus ?? "").trim().toLowerCase();
	return s === "attended";
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

export default function TrainingSessionDetailPage() {
	const params = useParams();
	const sessionId =
		typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const queryClient = useQueryClient();

	const { data: sessionDetailRes } = TrainingSessionApi.GetById.useQuery(
		sessionId,
		{
			enabled: hasHydrated && Boolean(sessionId.trim()),
		}
	);
	const sessionDetailRow = trainingSessionRowFromDetailApi(sessionDetailRes);
	const sessionCancelled =
		sessionDetailRow?.status?.toString().toLowerCase() === "cancelled";

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchInput, setSearchInput] = useState("");
	const [attendanceFilter, setAttendanceFilter] =
		useState<AttendanceFilter>("all");
	const [attendanceUiEpoch, setAttendanceUiEpoch] = useState(0);
	/** traineeId -> user toggled present (true) / absent (false); omit = use server value */
	const [attendanceOverrides, setAttendanceOverrides] = useState<
		Record<string, boolean>
	>({});
	const [isAttendanceEditing, setIsAttendanceEditing] = useState(false);
	const [reportSheetOpen, setReportSheetOpen] = useState(false);

	const { mutateAsync: markAttendanceAsync, isPending: isSavingAttendance } =
		TrainingSessionApi.MarkAttendance.useMutation({
			onError: (err) => {
				const ax = err as AxiosError<ErrorRes>;
				if (ax.response?.status === 404) {
					toast.error(
						trainingSessionErrorMessage(err, "Enrollment was not found.")
					);
					queryClient.invalidateQueries({
						queryKey: ["TrainingSession", sessionId],
					});
					return;
				}
				toast.error(
					trainingSessionErrorMessage(err, "Failed to update attendance.")
				);
			},
		});

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
		/** Avoid keeping previous rows while refetching — checkboxes must match server after save. */
		placeholderData: undefined,
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
			setAttendanceOverrides({});
			setAttendanceUiEpoch(0);
			setIsAttendanceEditing(false);
		});
	}, [sessionId]);

	async function savePageAttendance() {
		if (!isAttendanceEditing || sessionCancelled || !sessionId.trim()) return;
		const patchable = rows
			.map((row) => {
				const tid = resolveTraineeId(row);
				return tid ? { row, tid } : null;
			})
			.filter(
				(x): x is { row: SessionEnrollmentRow; tid: string } => x !== null
			);
		if (patchable.length === 0) {
			toast.message("No trainees on this page can be updated.");
			return;
		}

		const updates = patchable.map(({ row, tid }) => {
			const present = Object.hasOwn(attendanceOverrides, tid)
				? attendanceOverrides[tid]
				: isServerAttended(row);
	
			return markAttendanceAsync({
				trainingSessionId: sessionId,
				traineeId: tid,
				body: { attendanceStatus: present ? "attended" : "absent" },
			});
		});
		try {
			// Run all requests at the same time
			await Promise.all(updates);
	
			// Invalidate the WHOLE query key so all pages/filters refresh
			await queryClient.invalidateQueries({
				queryKey: ["TrainingSession", sessionId], 
			});
	
			startTransition(() => {
				setAttendanceOverrides({});
				setAttendanceUiEpoch((e) => e + 1);
				setIsAttendanceEditing(false);
			});
	
			toast.success("Attendance updated successfully");
		} catch (error) {
			toast.error(trainingSessionErrorMessage(error, "Failed to update attendance."));
		}
	}

	const patchableCount = rows.filter((r) => resolveTraineeId(r)).length;
	const canEditAttendance =
		!sessionCancelled && !isLoading && !isError && patchableCount > 0;

	const tableCell =
		"px-3 py-3 align-middle text-sm sm:px-5 sm:py-4 md:px-6 lg:px-8";

	return (
		<div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 sm:space-y-6">
			<div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-cyan-50 p-4 shadow-sm sm:rounded-3xl sm:p-6">
				<div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
				<div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl" />
				<div className="relative flex flex-col gap-4">
					<div className="min-w-0 space-y-2">
						<Button variant="ghost" size="sm" className="-ml-2 h-9 w-fit max-w-full gap-1.5 px-2 sm:px-3" asChild>
							<Link href="/coordinator/sessions" className="min-w-0">
								<ArrowLeft className="h-4 w-4 shrink-0" />
								<span className="truncate">Back to sessions</span>
							</Link>
						</Button>
						<h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[28px] lg:leading-tight">
							Session enrollments
						</h1>
						<p className="max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-sm sm:font-medium">
							Trainees enrolled in session{" "}
							<span className="break-all font-mono text-xs text-slate-800 sm:text-sm">
								{idPreview}
							</span>
							. Newest enrollments first (per server).
						</p>
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-blue-50 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6 lg:p-8">
				{!hasHydrated ? (
					<div className="flex min-h-[8rem] items-center justify-center gap-2 rounded-xl border border-gray-100 p-6 text-sm text-slate-600 sm:min-h-0 sm:rounded-2xl">
						<Loader2 className="h-4 w-4 shrink-0 animate-spin" />
						Loading…
					</div>
				) : !sessionId.trim() ? (
					<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
						Missing session id in the URL.
					</div>
				) : (
					<>
						<div className="mb-6 space-y-4">
							<div className="relative w-full min-w-0">
								<Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-4" />
								<Input
									placeholder="Search name, email, phone…"
									className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-base sm:pl-11 sm:text-sm"
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
							<div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-4">
								<div className="min-w-0 min-[520px]:col-span-1 lg:col-span-3">
									<label
										htmlFor="enrollment-attendance-filter"
										className="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-400 sm:ml-1"
									>
										List filter
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
										<SelectTrigger
											id="enrollment-attendance-filter"
											className="h-11 w-full rounded-xl border-slate-200 bg-white"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent position="popper" className="max-h-60">
											<SelectItem value="all">All</SelectItem>
											<SelectItem value="attended">Attended</SelectItem>
											<SelectItem value="absent">Absent</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="min-w-0 min-[520px]:col-span-1 lg:col-span-2">
									<label
										htmlFor="enrollment-page-size"
										className="mb-1 ml-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-400 sm:ml-1"
									>
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
										<SelectTrigger
											id="enrollment-page-size"
											className="h-11 w-full rounded-xl border-slate-200 bg-white"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent position="popper">
											<SelectItem value="10">10</SelectItem>
											<SelectItem value="20">20</SelectItem>
											<SelectItem value="50">50</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex min-w-0 flex-col gap-2 min-[520px]:col-span-2 lg:col-span-7 lg:flex-row lg:flex-wrap lg:items-end">
									{canEditAttendance && !isAttendanceEditing ? (
										<Button
											type="button"
											className="h-11 w-full shrink-0 rounded-xl lg:w-auto"
											disabled={isSavingAttendance}
											onClick={() => {
												startTransition(() => {
													setAttendanceOverrides({});
													setIsAttendanceEditing(true);
												});
											}}
										>
											Edit attendance
										</Button>
									) : null}
									{canEditAttendance && isAttendanceEditing ? (
										<>
											<Button
												type="button"
												className="h-11 w-full shrink-0 rounded-xl lg:w-auto"
												disabled={isSavingAttendance}
												onClick={() => void savePageAttendance()}
											>
												{isSavingAttendance ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : null}
												Save attendance
											</Button>
											<Button
												type="button"
												variant="outline"
												className="h-11 w-full shrink-0 rounded-xl lg:w-auto"
												disabled={isSavingAttendance}
												onClick={() => {
													startTransition(() => {
														setAttendanceOverrides({});
														setIsAttendanceEditing(false);
													});
												}}
											>
												Cancel
											</Button>
										</>
									) : null}
									<Button
										type="button"
										variant="outline"
										className="h-11 w-full shrink-0 gap-2 rounded-xl lg:w-auto"
										disabled={!sessionId.trim() || isLoading}
										onClick={() => setReportSheetOpen(true)}
									>
										<FileBarChart className="h-4 w-4 shrink-0" />
										Get report
									</Button>
								</div>
							</div>
						</div>

						{errorCopy ? (
							<div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 sm:rounded-2xl sm:p-5">
								<p className="text-pretty">{errorCopy.message}</p>
								{errorCopy.hint ? (
									<p className="mt-2 text-pretty text-red-700/90">{errorCopy.hint}</p>
								) : null}
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-3 w-full border-red-200 sm:w-auto"
									onClick={() => refetch()}
								>
									Retry
								</Button>
							</div>
						) : null}

						{sessionCancelled ? (
							<div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 sm:rounded-2xl sm:p-5">
								Attendance cannot be edited — session is cancelled.
							</div>
						) : null}

						<div className="-mx-1 overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200/80 bg-white shadow-sm [-webkit-overflow-scrolling:touch] sm:mx-0 md:rounded-2xl">
							<Table className="w-full min-w-[22rem] sm:min-w-[44rem] lg:min-w-[52rem] xl:min-w-0">
								<TableHeader className="bg-[#D6E6F2]">
									<TableRow className="border-none hover:bg-transparent">
										<TableHead
											className={`${tableCell} h-11 min-w-0 text-left text-[10px] font-bold uppercase tracking-wider text-[#4A5568] sm:h-12 sm:text-[11px]`}
										>
											Name
										</TableHead>
										<TableHead
											className={`${tableCell} h-11 min-w-0 text-left text-[10px] font-bold uppercase tracking-wider text-[#4A5568] sm:h-12 sm:text-[11px]`}
										>
											Email
										</TableHead>
										<TableHead
											className={`${tableCell} hidden h-11 text-left text-[10px] font-bold uppercase tracking-wider text-[#4A5568] md:table-cell md:h-12 sm:text-[11px]`}
										>
											Phone
										</TableHead>
										<TableHead
											className={`${tableCell} hidden h-11 text-left text-[10px] font-bold uppercase tracking-wider text-[#4A5568] sm:table-cell sm:h-12 sm:whitespace-nowrap sm:text-[11px]`}
										>
											Attended at
										</TableHead>
										<TableHead
											className={`${tableCell} hidden h-11 text-left text-[10px] font-bold uppercase tracking-wider text-[#4A5568] xl:table-cell xl:h-12 sm:text-[11px]`}
										>
											Note
										</TableHead>
										<TableHead
											className={`${tableCell} hidden h-11 text-left text-[10px] font-bold uppercase tracking-wider text-[#4A5568] lg:table-cell lg:h-12 sm:whitespace-nowrap sm:text-[11px]`}
										>
											Enrolled at
										</TableHead>
										<TableHead
											className={`${tableCell} sticky right-0 z-20 h-11 w-14 border-l border-slate-200/50 bg-[#D6E6F2] text-center text-[10px] font-bold uppercase tracking-wider text-[#4A5568] shadow-[-8px_0_16px_-10px_rgba(15,23,42,0.2)] sm:static sm:h-12 sm:w-auto sm:border-l-0 sm:bg-[#D6E6F2] sm:shadow-none sm:text-[11px]`}
										>
											Present
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
										rows.map((row) => {
											const tid = resolveTraineeId(row);
											const disabled =
												sessionCancelled || !tid;
											const checked = tid
												? Object.hasOwn(attendanceOverrides, tid)
													? attendanceOverrides[tid]
													: isServerAttended(row)
												: false;
											return (
												<TableRow
													key={row._id}
													className="group border-gray-50 hover:bg-slate-50/50"
												>
													<TableCell
														className={`${tableCell} min-w-0 font-semibold text-slate-900`}
													>
														<span className="line-clamp-2 sm:line-clamp-none">
															{resolveTraineeName(row.traineeId)}
														</span>
													</TableCell>
													<TableCell
														className={`${tableCell} min-w-0 max-w-[11rem] text-slate-600 sm:max-w-none`}
													>
														<span className="break-all text-xs sm:text-sm">
															{resolveTraineeEmail(row.traineeId)}
														</span>
													</TableCell>
													<TableCell
														className={`${tableCell} hidden text-slate-600 md:table-cell`}
													>
														<span className="whitespace-nowrap text-xs sm:text-sm">
															{resolveTraineePhone(row.traineeId)}
														</span>
													</TableCell>
													<TableCell
														className={`${tableCell} hidden text-slate-600 sm:table-cell`}
													>
														<span className="whitespace-nowrap text-xs sm:text-sm">
															{formatDt(row.attendedAt)}
														</span>
													</TableCell>
													<TableCell
														className={`${tableCell} hidden max-w-[10rem] text-slate-600 xl:table-cell xl:max-w-[14rem]`}
													>
														<span className="line-clamp-2 text-xs sm:text-sm xl:truncate xl:line-clamp-none">
															{row.note ?? "—"}
														</span>
													</TableCell>
													<TableCell
														className={`${tableCell} hidden text-slate-600 lg:table-cell`}
													>
														<span className="whitespace-nowrap text-xs sm:text-sm">
															{formatDt(row.createdAt)}
														</span>
													</TableCell>
													<TableCell
														className={`${tableCell} sticky right-0 z-10 border-l border-slate-100 bg-white text-center shadow-[-8px_0_16px_-10px_rgba(15,23,42,0.12)] transition-colors group-hover:bg-slate-50/80 sm:static sm:border-l-0 sm:bg-transparent sm:shadow-none sm:group-hover:bg-slate-50/50`}
													>
														<div className="flex justify-center sm:justify-start md:justify-center">
															{isAttendanceEditing && tid ? (
																<Checkbox
																	key={`${tid}-${attendanceUiEpoch}`}
																	checked={checked}
																	disabled={disabled}
																	title="Present (attended)"
																	onCheckedChange={(c) => {
																		if (!tid) return;
																		setAttendanceOverrides((prev) => ({
																			...prev,
																			[tid]: c === true,
																		}));
																	}}
																	aria-label={`Present: ${resolveTraineeName(row.traineeId)}`}
																/>
															) : (
																<span className="inline-flex justify-center">
																	{!tid ? (
																		<span className="text-slate-400">—</span>
																	) : isServerAttended(row) ? (
																		<Badge className="bg-emerald-100 font-semibold text-emerald-800 hover:bg-emerald-100">
																			Present
																		</Badge>
																	) : (
																		<Badge
																			variant="secondary"
																			className="font-semibold text-slate-600"
																		>
																			Absent
																		</Badge>
																	)}
																</span>
															)}
														</div>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</div>

						<PaginationControls
							className="mt-4 sm:mt-6"
							page={page}
							onPageChange={setPage}
							totalItems={totalItems}
							pageSize={pageSize}
							disabled={isLoading || isError}
						/>
					</>
				)}
			</div>

			<SessionAttendanceReportSheet
				open={reportSheetOpen}
				onOpenChange={setReportSheetOpen}
				sessionId={sessionId}
				title={sessionDetailRow?.title}
				scheduledAt={sessionDetailRow?.scheduledAt}
				location={sessionDetailRow?.location}
			/>
		</div>
	);
}
