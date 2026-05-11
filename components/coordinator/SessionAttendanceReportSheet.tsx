"use client";

import { useEffect, useState } from "react";
import TrainingSessionApi, {
	type AttendanceReportRow,
	type SessionEnrollmentTraineeRef,
	trainingSessionErrorMessage,
} from "@/lib/api/training-session";
import PaginationControls from "@/components/shared/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/store/useAuthStore";
import type { ErrorRes } from "@/types/core";
import { AxiosError } from "axios";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatDt(iso: string | undefined) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function resolveTraineeFromReportRow(row: AttendanceReportRow) {
	const traineeId = row.traineeId;
	if (traineeId && typeof traineeId === "object") {
		return traineeId as SessionEnrollmentTraineeRef;
	}
	return null;
}

function reportRowName(row: AttendanceReportRow) {
	const flat = row.name?.trim();
	if (flat) return flat;
	const t = resolveTraineeFromReportRow(row);
	if (t) {
		const name = `${t.firstname ?? ""} ${t.lastname ?? ""}`.trim();
		return name || t.email || "—";
	}
	if (typeof row.traineeId === "string" && row.traineeId.trim())
		return row.traineeId;
	return "—";
}

function reportRowEmail(row: AttendanceReportRow) {
	const flat = row.email?.trim();
	if (flat) return flat;
	const t = resolveTraineeFromReportRow(row);
	return t?.email ?? "—";
}

function reportRowPhone(row: AttendanceReportRow) {
	const flat = (row.phone ?? row.phoneNumber)?.trim();
	if (flat) return flat;
	const t = resolveTraineeFromReportRow(row);
	return t?.phoneNumber ?? "—";
}

function resolveReportError(error: unknown): { message: string; hint?: string } {
	const ax = error as AxiosError<ErrorRes>;
	const status = ax.response?.status;
	const raw =
		(typeof ax.response?.data === "object" &&
			ax.response?.data &&
			"message" in ax.response.data &&
			typeof (ax.response.data as ErrorRes).message === "string" &&
			(ax.response.data as ErrorRes).message) ||
		ax.message;

	if (status === 404) {
		return { message: raw || "Attendance report was not found." };
	}
	if (status === 400) {
		return {
			message: raw || "Invalid request.",
			hint: "Check the session id and try again.",
		};
	}
	if (status === 403) {
		return {
			message: raw || "You do not have access to this report.",
		};
	}
	return { message: raw || "Failed to load attendance report." };
}

function resolveSnapshotsError(error: unknown): {
	message: string;
	hint?: string;
} {
	const ax = error as AxiosError<ErrorRes>;
	const status = ax.response?.status;
	const raw =
		(typeof ax.response?.data === "object" &&
			ax.response?.data &&
			"message" in ax.response.data &&
			typeof (ax.response.data as ErrorRes).message === "string" &&
			(ax.response.data as ErrorRes).message) ||
		ax.message;

	if (status === 404) {
		return {
			message: raw || "Snapshot history is not available for this session.",
		};
	}
	if (status === 403) {
		return { message: raw || "You do not have access to snapshot history." };
	}
	return { message: raw || "Failed to load snapshots." };
}

const tableCell =
	"px-3 py-2 align-middle text-xs sm:px-4 sm:py-3 sm:text-sm";

export interface SessionAttendanceReportSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionId: string;
	title?: string;
	scheduledAt?: string;
	location?: string;
}

export default function SessionAttendanceReportSheet({
	open,
	onOpenChange,
	sessionId,
	title,
	scheduledAt,
	location,
}: SessionAttendanceReportSheetProps) {
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const [tab, setTab] = useState<"live" | "history">("live");
	const [reportPage, setReportPage] = useState(1);
	const [reportPageSize, setReportPageSize] = useState(10);
	const [snapshotPage, setSnapshotPage] = useState(1);
	const [snapshotPageSize, setSnapshotPageSize] = useState(10);
	const [exportNote, setExportNote] = useState("");

	useEffect(() => {
		if (open) {
			setReportPage(1);
			setSnapshotPage(1);
			setTab("live");
		}
	}, [open, sessionId]);

	const reportParams = { page: reportPage, limit: reportPageSize };
	const snapshotParams = { page: snapshotPage, limit: snapshotPageSize };

	const {
		data: reportData,
		isLoading: reportLoading,
		isError: reportIsError,
		error: reportError,
		refetch: refetchReport,
		isFetching: reportFetching,
	} = TrainingSessionApi.GetAttendanceReport.useQuery(sessionId, reportParams, {
		enabled: open && hasHydrated && Boolean(sessionId.trim()),
	});

	const {
		data: snapshotsData,
		isLoading: snapshotsLoading,
		isError: snapshotsIsError,
		error: snapshotsError,
		refetch: refetchSnapshots,
		isFetching: snapshotsFetching,
	} = TrainingSessionApi.GetAttendanceReportSnapshots.useQuery(
		sessionId,
		snapshotParams,
		{
			enabled:
				open &&
				hasHydrated &&
				Boolean(sessionId.trim()) &&
				tab === "history",
		}
	);

	const exportMutation = TrainingSessionApi.ExportAttendanceReport.useMutation({
		onSuccess: (result) => {
			const url = URL.createObjectURL(result.blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = result.filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			if (result.snapshotId) {
				toast.success(`Report saved: ${result.snapshotId}`);
			} else {
				toast.success("Download started.");
			}
		},
		onError: (err) => {
			toast.error(
				trainingSessionErrorMessage(err, "Failed to export attendance report.")
			);
		},
	});

	const reportRows = reportData?.data ?? [];
	const reportMeta = reportData?.meta;
	const summary = reportData?.summary;
	const reportSession = reportData?.session;

	const displayTitle =
		title ||
		(typeof reportSession?.title === "string" ? reportSession.title : undefined) ||
		"Training session";
	const displayAt =
		scheduledAt ||
		(typeof reportSession?.scheduledAt === "string"
			? reportSession.scheduledAt
			: undefined);
	const displayLoc =
		location ||
		(typeof reportSession?.location === "string"
			? reportSession.location
			: undefined);

	const reportErrorCopy = reportIsError ? resolveReportError(reportError) : null;
	const snapshotsErrorCopy = snapshotsIsError
		? resolveSnapshotsError(snapshotsError)
		: null;

	const snapshotRows = snapshotsData?.data ?? [];
	const snapshotMeta = snapshotsData?.meta;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex h-full w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-lg md:max-w-2xl lg:max-w-4xl"
			>
				<SheetHeader className="shrink-0 space-y-1 border-b px-4 py-4 text-left sm:px-6">
					<SheetTitle className="text-lg sm:text-xl">
						Attendance report
					</SheetTitle>
					<SheetDescription asChild>
						<div className="space-y-1 text-left text-sm text-slate-600">
							<p className="font-semibold text-slate-800">{displayTitle}</p>
							{displayAt ? (
								<p className="text-slate-600">{formatDt(displayAt)}</p>
							) : null}
							{displayLoc ? (
								<p className="text-slate-600">{displayLoc}</p>
							) : null}
						</div>
					</SheetDescription>
				</SheetHeader>

				<div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
					<Tabs
						value={tab}
						onValueChange={(v) => {
							if (v === "live" || v === "history") setTab(v);
						}}
						className="flex min-h-0 flex-1 flex-col gap-3"
					>
						<TabsList className="w-full shrink-0 justify-start sm:w-auto">
							<TabsTrigger value="live" className="flex-1 sm:flex-none">
								Live report
							</TabsTrigger>
							<TabsTrigger value="history" className="flex-1 sm:flex-none">
								Snapshot history
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value="live"
							className="mt-0 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden data-[state=inactive]:hidden"
						>
							{summary && Object.keys(summary).length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{typeof summary.attended === "number" ? (
										<Badge variant="secondary" className="rounded-lg px-3 py-1">
											Attended: {summary.attended}
										</Badge>
									) : null}
									{typeof summary.absent === "number" ? (
										<Badge variant="secondary" className="rounded-lg px-3 py-1">
											Absent: {summary.absent}
										</Badge>
									) : null}
									{typeof summary.total === "number" ? (
										<Badge variant="outline" className="rounded-lg px-3 py-1">
											Total: {summary.total}
										</Badge>
									) : null}
								</div>
							) : null}

							{reportErrorCopy ? (
								<div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
									<p>{reportErrorCopy.message}</p>
									{reportErrorCopy.hint ? (
										<p className="mt-2 text-red-700/90">{reportErrorCopy.hint}</p>
									) : null}
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="mt-3"
										onClick={() => void refetchReport()}
									>
										Retry
									</Button>
								</div>
							) : null}

							<div className="space-y-2">
								<label
									htmlFor="export-snapshot-note"
									className="text-xs font-semibold uppercase tracking-wide text-slate-500"
								>
									Export note (optional)
								</label>
								<Textarea
									id="export-snapshot-note"
									value={exportNote}
									onChange={(e) => setExportNote(e.target.value)}
									placeholder="Optional note stored with this snapshot…"
									className="min-h-[4rem] resize-y rounded-xl border-slate-200 text-sm"
									disabled={exportMutation.isPending}
								/>
							</div>

							<Button
								type="button"
								className="h-11 w-full shrink-0 gap-2 rounded-xl sm:w-auto"
								disabled={
									exportMutation.isPending ||
									reportLoading ||
									reportIsError ||
									!sessionId.trim()
								}
								onClick={() =>
									exportMutation.mutate({
										sessionId,
										note: exportNote.trim() || undefined,
									})
								}
							>
								{exportMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<FileSpreadsheet className="h-4 w-4" />
								)}
								Download Excel &amp; save report
							</Button>

							<div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200/80">
								<Table>
									<TableHeader className="sticky top-0 z-10 bg-[#D6E6F2]">
										<TableRow className="border-none hover:bg-transparent">
											<TableHead className={tableCell}>Name</TableHead>
											<TableHead className={tableCell}>Email</TableHead>
											<TableHead className={`${tableCell} hidden sm:table-cell`}>
												Phone
											</TableHead>
											<TableHead className={tableCell}>Status</TableHead>
											<TableHead
												className={`${tableCell} hidden md:table-cell`}
											>
												Attended at
											</TableHead>
											<TableHead
												className={`${tableCell} hidden lg:table-cell`}
											>
												Note
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody
										className={
											reportFetching && !reportLoading ? "opacity-70" : ""
										}
									>
										{reportLoading ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="h-32 text-center text-slate-600"
												>
													<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
													Loading report…
												</TableCell>
											</TableRow>
										) : reportIsError ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="h-24 text-center text-slate-500"
												>
													Unable to load rows.
												</TableCell>
											</TableRow>
										) : reportRows.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="h-24 text-center text-slate-500"
												>
													No rows on this page.
												</TableCell>
											</TableRow>
										) : (
											reportRows.map((row, i) => (
												<TableRow key={row._id ?? i}>
													<TableCell className={`${tableCell} font-medium`}>
														{reportRowName(row)}
													</TableCell>
													<TableCell
														className={`${tableCell} max-w-[10rem] break-all sm:max-w-none`}
													>
														{reportRowEmail(row)}
													</TableCell>
													<TableCell
														className={`${tableCell} hidden sm:table-cell`}
													>
														{reportRowPhone(row)}
													</TableCell>
													<TableCell className={tableCell}>
														{row.attendanceStatus ?? "—"}
													</TableCell>
													<TableCell
														className={`${tableCell} hidden md:table-cell`}
													>
														{formatDt(row.attendedAt)}
													</TableCell>
													<TableCell
														className={`${tableCell} hidden max-w-[8rem] lg:table-cell lg:max-w-[14rem]`}
													>
														<span className="line-clamp-2">{row.note ?? "—"}</span>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>

							<PaginationControls
								className="shrink-0 pt-1"
								page={reportPage}
								onPageChange={setReportPage}
								totalItems={reportMeta?.totalItems ?? 0}
								pageSize={reportPageSize}
								disabled={reportLoading || reportIsError}
							/>

							<div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
								<label htmlFor="report-page-size" className="sr-only">
									Rows per page
								</label>
								<span>Rows per page</span>
								<select
									id="report-page-size"
									className="rounded-md border border-slate-200 bg-white px-2 py-1"
									value={String(reportPageSize)}
									onChange={(e) => {
										const n = Number(e.target.value);
										setReportPageSize(
											Number.isFinite(n) && n > 0 ? n : 10
										);
										setReportPage(1);
									}}
								>
									<option value="10">10</option>
									<option value="20">20</option>
									<option value="50">50</option>
								</select>
							</div>
						</TabsContent>

						<TabsContent
							value="history"
							className="mt-0 flex min-h-0 flex-1 flex-col gap-3 data-[state=inactive]:hidden"
						>
							{snapshotsErrorCopy ? (
								<div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
									<p>{snapshotsErrorCopy.message}</p>
									{snapshotsErrorCopy.hint ? (
										<p className="mt-2">{snapshotsErrorCopy.hint}</p>
									) : null}
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="mt-3"
										onClick={() => void refetchSnapshots()}
									>
										Retry
									</Button>
								</div>
							) : null}

							<div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200/80">
								<Table>
									<TableHeader className="bg-[#D6E6F2]">
										<TableRow className="border-none hover:bg-transparent">
											<TableHead className={tableCell}>Saved at</TableHead>
											<TableHead className={tableCell}>Note</TableHead>
											<TableHead className={tableCell}>Attended</TableHead>
											<TableHead className={tableCell}>Absent</TableHead>
											<TableHead className={tableCell}>Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody
										className={
											snapshotsFetching && !snapshotsLoading ? "opacity-70" : ""
										}
									>
										{snapshotsLoading ? (
											<TableRow>
												<TableCell
													colSpan={5}
													className="h-32 text-center text-slate-600"
												>
													<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
													Loading snapshots…
												</TableCell>
											</TableRow>
										) : snapshotsIsError ? (
											<TableRow>
												<TableCell
													colSpan={5}
													className="h-24 text-center text-slate-500"
												>
													Unable to load snapshots.
												</TableCell>
											</TableRow>
										) : snapshotRows.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={5}
													className="h-24 text-center text-slate-500"
												>
													No snapshots yet. Export to create one.
												</TableCell>
											</TableRow>
										) : (
											snapshotRows.map((snap) => (
												<TableRow key={snap._id}>
													<TableCell className={tableCell}>
														{formatDt(snap.createdAt)}
													</TableCell>
													<TableCell
														className={`${tableCell} max-w-[12rem] truncate`}
													>
														{snap.note?.trim() || "—"}
													</TableCell>
													<TableCell className={tableCell}>
														{typeof snap.summary?.attended === "number"
															? snap.summary.attended
															: "—"}
													</TableCell>
													<TableCell className={tableCell}>
														{typeof snap.summary?.absent === "number"
															? snap.summary.absent
															: "—"}
													</TableCell>
													<TableCell className={tableCell}>
														{typeof snap.summary?.total === "number"
															? snap.summary.total
															: "—"}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>

							<PaginationControls
								className="shrink-0"
								page={snapshotPage}
								onPageChange={setSnapshotPage}
								totalItems={snapshotMeta?.totalItems ?? 0}
								pageSize={snapshotPageSize}
								disabled={snapshotsLoading || snapshotsIsError}
							/>

							<div className="flex items-center gap-2 text-xs text-slate-500">
								<span>Rows per page</span>
								<select
									className="rounded-md border border-slate-200 bg-white px-2 py-1"
									value={String(snapshotPageSize)}
									onChange={(e) => {
										const n = Number(e.target.value);
										setSnapshotPageSize(
											Number.isFinite(n) && n > 0 ? n : 10
										);
										setSnapshotPage(1);
									}}
								>
									<option value="10">10</option>
									<option value="20">20</option>
									<option value="50">50</option>
								</select>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}
