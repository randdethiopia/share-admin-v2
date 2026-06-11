"use client";

import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	startTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import TraineeAuth, { type TraineeType } from "@/lib/api/trainee";
import PaginationControls from "@/components/shared/PaginationControls";
import { CoordinatorScopePicker } from "@/components/coordinator/CoordinatorScopePicker";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Loader2, Search, Users } from "lucide-react";
import { CreateSessionModal } from "./components/create-session";

type TraineeStatusFilter = "all" | "active" | "inactive";

function normalizeIsActive(value: unknown) {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value === 1;
	if (typeof value === "string") {
		const v = value.trim().toLowerCase();
		return v === "true" || v === "1" || v === "active";
	}
	return false;
}

function resolveErrorCopy(error: unknown): { message: string; hint?: string } {
	const ax = error as AxiosError<ErrorRes>;
	const status = ax.response?.status;
	const raw = ax.response?.data?.message;

	if (status === 404) {
		return {
			message: raw || "Coordinator not found.",
			hint: "Check that your account is registered as a coordinator.",
		};
	}
	if (status === 403) {
		return {
			message: raw || "You do not have permission to view these trainees.",
		};
	}
	if (status === 400) {
		return {
			message: raw || "Invalid coordinator id.",
		};
	}
	return {
		message: raw || "Failed to load trainees.",
	};
}

const MONGO_OBJECT_ID = /^[a-f\d]{24}$/i;
const COORDINATOR_URL_PARAM = "coordinator";

function CoordinatorMyTraineesPageInner() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const queryClient = useQueryClient();
	const coordinatorParam = searchParams.get(COORDINATOR_URL_PARAM)?.trim() ?? "";
	/** While router.replace updates the URL, searchParams can lag behind picker state; avoid reverting selection to the stale param. */
	const pendingCoordinatorInUrl = useRef<string | null>(null);

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
	const [status, setStatus] = useState<TraineeStatusFilter>("all");

	useEffect(() => {
		const t = setTimeout(() => {
			setSearch(searchInput);
			setPage(1);
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput]);

	useEffect(() => {
		if (!hasHydrated) return;
		if (!effectiveCoordinatorId.trim()) return;
		startTransition(() => {
			setPage(1);
			setSearchInput("");
			setSearch("");
			setStatus("all");
		});
	}, [hasHydrated, effectiveCoordinatorId]);

	useEffect(() => {
		if (!isPickerMode || !hasHydrated || coordinators.length === 0) return;
		if (!coordinatorParam || !MONGO_OBJECT_ID.test(coordinatorParam)) return;
		if (!coordinators.some((c) => c._id === coordinatorParam)) return;

		if (
			pendingCoordinatorInUrl.current !== null &&
			coordinatorParam === pendingCoordinatorInUrl.current
		) {
			pendingCoordinatorInUrl.current = null;
			return;
		}

		if (coordinatorParam === selectedCoordinatorId) {
			pendingCoordinatorInUrl.current = null;
			return;
		}

		if (pendingCoordinatorInUrl.current !== null) {
			return;
		}

		setSelectedCoordinatorId(coordinatorParam);
	}, [
		isPickerMode,
		hasHydrated,
		coordinators,
		coordinatorParam,
		selectedCoordinatorId,
		setSelectedCoordinatorId,
	]);

	useEffect(() => {
		if (!isPickerMode || !hasHydrated || coordinators.length === 0) return;
		if (!coordinatorParam || !MONGO_OBJECT_ID.test(coordinatorParam)) return;
		if (coordinators.some((c) => c._id === coordinatorParam)) return;
		const params = new URLSearchParams(searchParams.toString());
		params.delete(COORDINATOR_URL_PARAM);
		const qs = params.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname || "/", { scroll: false });
	}, [
		isPickerMode,
		hasHydrated,
		coordinators,
		coordinatorParam,
		pathname,
		router,
		searchParams,
	]);

	// Coordinators should never carry an explicit coordinator id in the URL.
	useEffect(() => {
		if (!hasHydrated) return;
		if (isPickerMode) return;
		if (!coordinatorParam) return;
		const params = new URLSearchParams(searchParams.toString());
		params.delete(COORDINATOR_URL_PARAM);
		const qs = params.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname || "/", { scroll: false });
	}, [hasHydrated, isPickerMode, coordinatorParam, pathname, router, searchParams]);

	const handleCoordinatorScopeChange = useCallback(
		(id: string) => {
			const next = id.trim();
			pendingCoordinatorInUrl.current = next;
			// Reset filters immediately so we don't briefly query the next coordinator
			// with the previous coordinator's page/search/status.
			startTransition(() => {
				setPage(1);
				setSearchInput("");
				setSearch("");
				setStatus("all");
			});
			setSelectedCoordinatorId(id);
			// Invalidate all coordinator-roster queries (any coordinator, any page/filter).
			queryClient.invalidateQueries({ queryKey: ["Trainee", "coordinator"] });
			const params = new URLSearchParams(searchParams.toString());
			if (next) {
				params.set(COORDINATOR_URL_PARAM, next);
			} else {
				params.delete(COORDINATOR_URL_PARAM);
			}
			const qs = params.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname || "/", { scroll: false });
		},
		[pathname, queryClient, router, searchParams, setSelectedCoordinatorId]
	);

	const statusParam = useMemo(() => {
		if (status === "inactive") return "0";
		return undefined;
	}, [status]);

	const canFetch = canScopeTraineeFetch;

	const coordinatorRosterQuery = TraineeAuth.GetCoordinatorTrainees.useQuery(
		effectiveCoordinatorId,
		page,
		pageSize,
		undefined,
		search.trim() || undefined,
		statusParam,
		{ enabled: canFetch && isPickerMode }
	);

	const myRosterQuery = TraineeAuth.GetMyCoordinatorTrainees.useQuery(
		page,
		pageSize,
		undefined,
		search.trim() || undefined,
		statusParam,
		{ enabled: canFetch && !isPickerMode }
	);

	const { data, isLoading, isError, error } = isPickerMode
		? coordinatorRosterQuery
		: myRosterQuery;

	const trainees = useMemo(() => data?.data ?? [], [data]);
	const totalItems = data?.meta?.totalItems ?? 0;

	const visibleTrainees = useMemo(() => {
		if (status === "active") {
			return trainees.filter((t) => normalizeIsActive(t.isActive));
		}
		if (status === "inactive") {
			return trainees.filter((t) => !normalizeIsActive(t.isActive));
		}
		return trainees;
	}, [trainees, status]);

	const errorCopy = isError ? resolveErrorCopy(error) : null;

	const traineeRosterSection = (
		<>
			<div className="mb-6 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:gap-x-4 lg:gap-y-3">
				<div className="relative w-full min-w-0 flex-1 max-w-md">
					<Label
						htmlFor="my-trainees-search"
						className="mb-1.5 ml-0.5 block text-xs font-medium text-muted-foreground"
					>
						Search
					</Label>
					<div className="relative">
						<Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							id="my-trainees-search"
							placeholder="Name or phone number…"
							className="h-11 rounded-xl border-slate-200 bg-slate-50/90 pl-10 shadow-sm"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>
				</div>

				<div className="flex flex-wrap items-end gap-3 sm:gap-4">
					<div className="w-[10.5rem] min-w-0 sm:w-40">
						<Label
							htmlFor="my-trainees-status"
							className="mb-1.5 ml-0.5 block text-xs font-medium text-muted-foreground"
						>
							Status
						</Label>
						<Select
							value={status}
							onValueChange={(v) => {
								if (v === "all" || v === "active" || v === "inactive") {
									setStatus(v);
									setPage(1);
								}
							}}
						>
							<SelectTrigger
								id="my-trainees-status"
								className="h-11 w-full rounded-xl border-slate-200 bg-white shadow-sm"
							>
								<SelectValue placeholder="All statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								<SelectItem value="active">Active only</SelectItem>
								<SelectItem value="inactive">Inactive only</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="w-[10.5rem] min-w-0 sm:w-36">
						<Label
							htmlFor="my-trainees-page-size"
							className="mb-1.5 ml-0.5 block text-xs font-medium text-muted-foreground"
						>
							Rows per page
						</Label>
						<Select
							value={String(pageSize)}
							onValueChange={(v) => {
								const next = Number(v);
								setPageSize(Number.isFinite(next) && next > 0 ? next : 10);
								setPage(1);
							}}
						>
							<SelectTrigger
								id="my-trainees-page-size"
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
				</div>
			</div>

			{isError && errorCopy && (
				<div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
					<div className="font-semibold">{errorCopy.message}</div>
					{errorCopy.hint && (
						<div className="mt-1 text-xs text-red-700">{errorCopy.hint}</div>
					)}
				</div>
			)}

			<div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
				<div className="overflow-x-auto">
					<Table className="min-w-180">
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Name
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Phone
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Email
								</TableHead>
								<TableHead className="h-12 px-6 text-center text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Status
								</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-40 text-center text-sm text-slate-600"
									>
										<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
										Loading trainees…
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-24 text-center text-sm text-slate-500"
									>
										Could not load trainees. See the message above.
									</TableCell>
								</TableRow>
							) : visibleTrainees.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="h-40 py-10">
										<div className="flex flex-col items-center justify-center gap-2 text-center text-slate-500">
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
												<Users className="h-6 w-6" />
											</div>
											<p className="text-sm font-medium text-slate-700">
												No trainees in this roster
											</p>
											<p className="max-w-sm text-xs text-slate-500">
												Try adjusting search or status filters, or check back after
												assignments are made.
											</p>
										</div>
									</TableCell>
								</TableRow>
							) : (
								visibleTrainees.map((trainee: TraineeType) => (
									<TableRow
										key={trainee._id}
										className="border-slate-100 transition-colors hover:bg-slate-50/80"
									>
										<TableCell className="px-6 py-4 font-semibold text-slate-900 sm:px-8 sm:py-5">
											{`${trainee.firstname ?? ""} ${trainee.lastname ?? ""}`.trim() ||
												trainee.username ||
												"—"}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm tabular-nums text-slate-600 sm:px-8 sm:py-5">
											{trainee.phoneNumber || "—"}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-slate-600 sm:px-8 sm:py-5">
											<span className="block max-w-56 truncate">
												{trainee.email || "—"}
											</span>
										</TableCell>
										<TableCell className="px-6 py-4 sm:px-8 sm:py-5">
											<div className="flex items-center justify-center">
												<span
													className={cn(
														"rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
														normalizeIsActive(trainee.isActive)
															? "bg-emerald-100 text-emerald-800"
															: "bg-slate-100 text-slate-600"
													)}
												>
													{normalizeIsActive(trainee.isActive)
														? "Active"
														: "Inactive"}
												</span>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<PaginationControls
				className="mt-6"
				page={page}
				onPageChange={setPage}
				totalItems={totalItems}
				pageSize={pageSize}
				disabled={isLoading || isError}
			/>
		</>
	);

	return (
		<>
			<div className="space-y-8 px-4 sm:px-0">
				<div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-r from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
					<div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/70 blur-2xl" />
					<div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl" />

					<div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
						<div className="space-y-2">
							<h1 className="text-[28px] font-bold tracking-tight text-slate-900">
								My Trainees
							</h1>
							<p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
								View trainees assigned to this coordinator and create training
								session blocks for upcoming days.
							</p>
						</div>

						<div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
							<CreateSessionModal />
						</div>
					</div>
				</div>

				<div className="rounded-[2rem] border border-blue-50/80 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
					{!hasHydrated ? (
						<div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-6 text-sm text-slate-600">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading session…
						</div>
					) : !hasValidSelfId && !isPickerMode ? (
						<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
							Unable to resolve your account id. Sign in again and retry.
						</div>
					) : isPickerMode ? (
						<>
							<Card className="mb-6 gap-0 border-slate-200/80 py-0 shadow-sm">
								<CardHeader className="space-y-1.5 px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
									<CardTitle className="text-base text-slate-900">
										Trainee roster scope
									</CardTitle>
									<CardDescription className="text-pretty">
										Choose which coordinator&apos;s assigned trainees appear in the
										table below. Your selection is remembered for other coordinator
										pages until you change it.
									</CardDescription>
								</CardHeader>
								<CardContent className="border-t border-slate-100 px-4 pb-4 pt-4 sm:px-6 sm:pb-5">
									<CoordinatorScopePicker
										coordinators={coordinators}
										value={selectedCoordinatorId}
										onValueChange={handleCoordinatorScopeChange}
										isLoading={isCoordinatorListLoading}
										isError={isCoordinatorListError}
										id="my-trainees-coordinator-scope"
									/>
								</CardContent>
							</Card>
							{!selectedCoordinatorId.trim() ? (
								<div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-900">
									Select a coordinator above to load their trainees.
								</div>
							) : (
								traineeRosterSection
							)}
						</>
					) : (
						traineeRosterSection
					)}
				</div>
			</div>
		</>
	);
}

// `useSearchParams()` triggers a CSR bailout during prerender; the Suspense
// boundary lets Next.js statically render this route's shell.
export default function CoordinatorMyTraineesPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[60vh] items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<CoordinatorMyTraineesPageInner />
		</Suspense>
	);
}
