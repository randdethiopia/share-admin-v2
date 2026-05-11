"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CoordinatorScopePicker } from "@/components/coordinator/CoordinatorScopePicker";
import TraineeAuth, { type TraineeType } from "@/lib/api/trainee";
import TrainingSessionApi, {
	enrollTraineesSummaryFromResponse,
	trainingSessionErrorMessage,
} from "@/lib/api/training-session";
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
import { useCoordinatorScope } from "@/hooks/use-coordinator-scope";
import useAuthStore from "@/store/useAuthStore";
import type { ErrorRes } from "@/types/core";
import { AxiosError } from "axios";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const MONGO_OBJECT_ID = /^[a-f\d]{24}$/i;

function resolveTraineeName(trainee: TraineeType) {
	const fullName = `${trainee.firstname ?? ""} ${trainee.lastname ?? ""}`.trim();
	return fullName || trainee.username || trainee.email || "—";
}

function buildEnrollToastDescription(
	summary: ReturnType<typeof enrollTraineesSummaryFromResponse>
): string {
	const { enrolledCount, alreadyEnrolledCount, missingTraineeIds } = summary;
	const k = missingTraineeIds.length;
	const parts: string[] = [
		`Enrolled ${enrolledCount} trainee(s).`,
		`${alreadyEnrolledCount} already on this session.`,
		`${k} ID(s) not found.`,
	];
	let desc = parts.join(" ");
	if (enrolledCount === 0 && (alreadyEnrolledCount > 0 || k > 0)) {
		desc += " No new enrollments were added — this is expected when everyone was already enrolled or IDs were invalid.";
	}
	return desc;
}

export default function AssignTraineesToSessionPage() {
	const router = useRouter();
	const params = useParams();
	const trainingSessionId =
		typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const {
		isPickerMode,
		effectiveCoordinatorId,
		canScopeTraineeFetch,
		hasValidSelfId,
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
	const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

	useEffect(() => {
		const t = setTimeout(() => {
			setSearch(searchInput);
			setPage(1);
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput]);

	const canFetch =
		hasHydrated &&
		canScopeTraineeFetch &&
		Boolean(trainingSessionId);

	const coordinatorRosterQuery = TraineeAuth.GetCoordinatorTrainees.useQuery(
		effectiveCoordinatorId,
		page,
		pageSize,
		undefined,
		search.trim() || undefined,
		undefined,
		{ enabled: canFetch && isPickerMode }
	);

	const myRosterQuery = TraineeAuth.GetMyCoordinatorTrainees.useQuery(
		page,
		pageSize,
		undefined,
		search.trim() || undefined,
		undefined,
		{ enabled: canFetch && !isPickerMode }
	);

	const { data, isLoading, isError, error } = isPickerMode
		? coordinatorRosterQuery
		: myRosterQuery;

	const trainees = useMemo(() => data?.data ?? [], [data]);
	const totalItems = data?.meta?.totalItems ?? 0;

	const { mutate, isPending } = TrainingSessionApi.EnrollTrainees.useMutation({
		onError: (err) => {
			toast.error(trainingSessionErrorMessage(err, "Failed to enroll trainees."));
		},
	});

	const toggleOne = (id: string, checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const handleSubmit = () => {
		const raw = [...selectedIds];
		const valid = [...new Set(raw.filter((id) => MONGO_OBJECT_ID.test(id)))];
		if (valid.length === 0) {
			toast.warning("Select at least one trainee with a valid id.");
			return;
		}
		mutate(
			{ trainingSessionId, traineeIds: valid },
			{
				onSuccess: (res) => {
					const summary = enrollTraineesSummaryFromResponse(res);
					const r = res as { message?: string };
					const serverMsg =
						typeof r.message === "string" && r.message.trim()
							? r.message.trim()
							: undefined;
					const description = buildEnrollToastDescription(summary);
					toast.success(serverMsg ?? "Enrollment finished", {
						description,
						duration: 8000,
					});
					router.push("/coordinator/sessions");
				},
			}
		);
	};

	const errorMessage =
		isError && error instanceof AxiosError
			? (error.response?.data as ErrorRes | undefined)?.message ||
				"Failed to load trainees."
			: null;

	const assignRosterSection = (
		<>
			{errorMessage ? (
				<div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
					{errorMessage}
				</div>
			) : null}

			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
				<div className="relative w-full max-w-sm">
					<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<Input
						placeholder="Search name or phone…"
						className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
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

			<div className="overflow-x-auto rounded-2xl border border-gray-100">
				<Table>
					<TableHeader className="bg-[#D6E6F2]">
						<TableRow className="border-none hover:bg-transparent">
							<TableHead className="w-12 px-4" />
							<TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
								Name
							</TableHead>
							<TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
								Email
							</TableHead>
							<TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
								Type
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-36 text-center text-sm text-slate-600"
								>
									<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
									Loading trainees…
								</TableCell>
							</TableRow>
						) : isError ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-28 text-center text-sm text-slate-500"
								>
									Could not load trainees.
								</TableCell>
							</TableRow>
						) : trainees.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="h-28 text-center text-sm text-slate-500"
								>
									No trainees match your filters.
								</TableCell>
							</TableRow>
						) : (
							trainees.map((row) => {
								const idOk = MONGO_OBJECT_ID.test(row._id);
								return (
									<TableRow key={row._id} className="border-gray-50">
										<TableCell className="px-4">
											<Checkbox
												checked={selectedIds.has(row._id)}
												onCheckedChange={(c) => toggleOne(row._id, c === true)}
												disabled={!idOk}
												aria-label={`Select ${resolveTraineeName(row)}`}
											/>
										</TableCell>
										<TableCell className="font-medium text-slate-900">
											{resolveTraineeName(row)}
											{!idOk ? (
												<span className="ml-2 text-xs text-amber-600">
													(unsupported id)
												</span>
											) : null}
										</TableCell>
										<TableCell className="text-sm text-slate-600">
											{row.email ?? "—"}
										</TableCell>
										<TableCell className="text-sm text-slate-600">
											{row.type ?? "—"}
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			<div className="mt-6">
				<PaginationControls
					page={page}
					onPageChange={setPage}
					totalItems={totalItems}
					pageSize={pageSize}
					disabled={isLoading || isError}
				/>
			</div>
		</>
	);

	const idPreview =
		trainingSessionId.length > 18
			? `${trainingSessionId.slice(0, 10)}…${trainingSessionId.slice(-6)}`
			: trainingSessionId || "—";

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
							Assign trainees
						</h1>
						<p className="max-w-2xl text-sm font-medium text-slate-600">
							Choose trainees from your roster to enroll in session{" "}
							<span className="font-mono text-slate-800">{idPreview}</span>.
						</p>
					</div>
					<div className="flex flex-col items-stretch gap-2 sm:items-end">
						<Button
							className="bg-sky-600 hover:bg-sky-700"
							disabled={isPending || selectedIds.size === 0}
							onClick={handleSubmit}
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Enrolling…
								</>
							) : (
								<>Enroll selected ({selectedIds.size})</>
							)}
						</Button>
					</div>
				</div>
			</div>

			<div className="rounded-[2rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
				{!hasHydrated ? (
					<div className="flex items-center gap-2 rounded-2xl border border-gray-100 p-6 text-sm text-slate-600">
						<Loader2 className="h-4 w-4 animate-spin" />
						Loading…
					</div>
				) : !trainingSessionId ? (
					<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
						Missing session id in the URL.
					</div>
				) : !hasValidSelfId && !isPickerMode ? (
					<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
						Unable to resolve your account id. Sign in again and retry.
					</div>
				) : isPickerMode ? (
					<>
						<div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
							<CoordinatorScopePicker
								coordinators={coordinators}
								value={selectedCoordinatorId}
								onValueChange={setSelectedCoordinatorId}
								isLoading={isCoordinatorListLoading}
								isError={isCoordinatorListError}
								id="assign-session-coordinator-scope"
							/>
						</div>
						{!selectedCoordinatorId.trim() ? (
							<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
								Select a coordinator above to load their trainees for enrollment.
							</div>
						) : (
							assignRosterSection
						)}
					</>
				) : (
					assignRosterSection
				)}
			</div>
		</div>
	);
}
