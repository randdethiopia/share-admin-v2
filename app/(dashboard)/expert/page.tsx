"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import api from "@/lib/api";
import type { AdvisorProfileType } from "@/lib/api";
import PaginationControls from "@/components/shared/PaginationControls";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/shared/admin/PageHeader";
import { StatusBadge } from "@/components/shared/admin/StatusBadge";
import { Button } from "@/components/ui/button";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";
import {
	buildUrlWithStatus,
	parseStatusParam,
	STATUS_URL_PARAM,
} from "@/hooks/use-url-pagination";
import { cn } from "@/lib/utils";
import { Check, Eye, Loader2, Search, X, MoreHorizontal } from "lucide-react";

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
const EXPERT_STATUS_VALUES = [
	"PENDING",
	"APPROVED",
	"REJECTED",
	"DRAFT",
] as const satisfies readonly StatusFilter[];

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function formatDate(value?: string) {
	if (!value) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString();
}

function ExpertPageInner() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const statusFromUrl = React.useMemo(
		() =>
			parseStatusParam(
				searchParams.get(STATUS_URL_PARAM),
				EXPERT_STATUS_VALUES
			) as StatusFilter,
		[searchParams]
	);

	const [search, setSearch] = React.useState("");
	const [status, setStatus] = React.useState<StatusFilter>(statusFromUrl);
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
	const [approveOpen, setApproveOpen] = React.useState(false);
	const [rejectOpen, setRejectOpen] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);

	const {
		data: advisors = [],
		isLoading,
		isError,
		error,
	} = api.AdvisorProfile.GetList.useQuery();

	const approveMutation = api.AdvisorProfile.Approve.useMutation({
		onSuccess: () => {
			setApproveOpen(false);
			setSelectedId(null);
		},
	});

	const rejectMutation = api.AdvisorProfile.Reject.useMutation({
		onSuccess: () => {
			setRejectOpen(false);
			setSelectedId(null);
		},
	});

	React.useEffect(() => {
		setStatus(statusFromUrl);
	}, [statusFromUrl]);

	const setStatusFilter = React.useCallback(
		(value: StatusFilter) => {
			setStatus(value);
			setPage(1);
			router.replace(
				buildUrlWithStatus(pathname, searchParams, value),
				{ scroll: false }
			);
		},
		[pathname, router, searchParams]
	);

	const filteredData = React.useMemo(() => {
		const query = search.trim().toLowerCase();
		return (advisors as AdvisorProfileType[]).filter((advisor) => {
			const matchesSearch = query
				? (advisor.fullName ?? "").toLowerCase().includes(query) ||
					(advisor.email ?? "").toLowerCase().includes(query) ||
					(advisor.phoneNumber ?? "").toLowerCase().includes(query)
				: true;
			const normalized = normalizeStatus(advisor.status);
			const matchesStatus = status === "all" || normalized === status;
			return matchesSearch && matchesStatus;
		});
	}, [advisors, search, status]);

	const pagination = React.useMemo(
		() => getPaginationMeta(filteredData.length, page, pageSize),
		[filteredData.length, page, pageSize]
	);

	React.useEffect(() => {
		if (page !== pagination.safePage) setPage(pagination.safePage);
	}, [page, pagination.safePage]);

	const pageData = React.useMemo(() => {
		return filteredData.slice(
			pagination.startIndex,
			pagination.endIndexExclusive
		);
	}, [filteredData, pagination.startIndex, pagination.endIndexExclusive]);

	const isMutating = approveMutation.isPending || rejectMutation.isPending;

	const openApprove = (id: string) => {
		setSelectedId(id);
		setApproveOpen(true);
	};

	const openReject = (id: string) => {
		setSelectedId(id);
		setRejectOpen(true);
	};

	const confirmApprove = () => {
		if (!selectedId) return;
		approveMutation.mutate(selectedId);
	};

	const confirmReject = () => {
		if (!selectedId) return;
		rejectMutation.mutate(selectedId);
	};

	const emptyState = (
		<div className="h-40 flex items-center justify-center text-sm text-gray-500">
			No advisors found.
		</div>
	);

	return (
		<div className="space-y-6">
			<AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Approve expert?</AlertDialogTitle>
						<AlertDialogDescription>
							This will mark the expert as approved. This action can’t be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={approveMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								confirmApprove();
							}}
							disabled={approveMutation.isPending}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{approveMutation.isPending ? "Approving…" : "Approve"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Reject expert?</AlertDialogTitle>
						<AlertDialogDescription>
							This will mark the Expert as rejected. This action can’t be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={rejectMutation.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								confirmReject();
							}}
							disabled={rejectMutation.isPending}
							className="bg-red-600 hover:bg-red-700"
						>
							{rejectMutation.isPending ? "Rejecting…" : "Reject"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<PageHeader
				category="EXPERT DIRECTORY"
				title="Expert Profiles"
				description="Manage and verify expert profiles."
			/>

			<div className="bg-card rounded-xl border border-border shadow-sm p-6 min-h-[70vh]">
				<div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search"
							className="pl-11 bg-[#F3F8FF] border-none h-12 rounded-xl text-sm"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-3">
						<span className="text-xs font-bold text-gray-400">Status</span>
						<Select
							value={status}
							onValueChange={(value) => {
								if (
									value === "all" ||
									value === "PENDING" ||
									value === "APPROVED" ||
									value === "REJECTED" ||
									value === "DRAFT"
								) {
									setStatusFilter(value);
								}
							}}
						>
							<SelectTrigger className="w-full sm:w-40 md:w-36 bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold">
								<SelectValue placeholder="All" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="PENDING">Pending</SelectItem>
								<SelectItem value="DRAFT">Draft</SelectItem>
								<SelectItem value="APPROVED">Approved</SelectItem>
								<SelectItem value="REJECTED">Rejected</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				
				<div className="md:hidden space-y-3">
					{isLoading ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-600">
							<Loader2 className="animate-spin mr-2" /> Loading...
						</div>
					) : isError ? (
						<div className="h-40 flex items-center justify-center text-sm text-red-600 text-center px-2">
							{(error as { response?: { data?: { message?: string } } })?.response?.data
								?.message || "Failed to load advisors"}
						</div>
					) : filteredData.length === 0 ? (
						emptyState
					) : (
						pageData.map((advisor) => (
							<div
								key={advisor._id}
								className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-sm font-bold text-gray-900 truncate">
											{advisor.fullName || "—"}
										</p>
										<p className="text-xs text-gray-600 truncate">
											{advisor.email || advisor.phoneNumber || "—"}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<StatusBadge status={advisor.status} />
									</div>
								</div>

								<div className="mt-3 grid grid-cols-2 gap-3">
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Approved
										</p>
										<p className="text-xs font-semibold text-gray-700">
											{formatDate(advisor.approvedAt)}
										</p>
									</div>
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Created
										</p>
										<p className="text-xs font-semibold text-gray-700">
											{formatDate(advisor.createdAt)}
										</p>
									</div>
								</div>

								<div className="mt-4 flex items-center justify-end">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 rounded-full"
											>
												<MoreHorizontal size={16} />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-40">
											<DropdownMenuItem asChild>
												<Link href={`/expert/${advisor._id}`} className="flex items-center gap-2 cursor-pointer">
													<Eye size={14} />
													<span>View Details</span>
												</Link>
											</DropdownMenuItem>
											{normalizeStatus(advisor.status) === "PENDING" && (
												<>
													<DropdownMenuItem
														onClick={() => openApprove(advisor._id)}
														disabled={isMutating}
														className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
													>
														<Check size={14} />
														<span>Approve</span>
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => openReject(advisor._id)}
														disabled={isMutating}
														className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
													>
														<X size={14} />
														<span>Reject</span>
													</DropdownMenuItem>
												</>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						))
					)}
				</div>

				
				<div className="hidden md:block overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Expert</TableHead>
									<TableHead>Approved Date</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-center">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={4} className="h-40 text-center">
											<Loader2 className="animate-spin inline mr-2" /> Loading...
										</TableCell>
									</TableRow>
								) : isError ? (
									<TableRow>
										<TableCell colSpan={4} className="h-40 text-center text-sm text-red-600">
											{(error as { response?: { data?: { message?: string } } })?.response?.data
												?.message || "Failed to load advisors"}
										</TableCell>
									</TableRow>
								) : filteredData.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="h-40 text-center text-sm text-gray-500">
											No advisors found.
										</TableCell>
									</TableRow>
								) : (
									pageData.map((advisor) => (
										<TableRow
											key={advisor._id}
											className="hover:bg-slate-50/50 border-gray-50"
										>
											<TableCell className="px-6 py-4 text-xs font-bold text-gray-600">
												<div className="flex flex-col">
													<span className="truncate">{advisor.fullName || "—"}</span>
													<span className="text-[11px] text-gray-400 font-medium truncate">
														{advisor.email || advisor.phoneNumber || "—"}
													</span>
												</div>
											</TableCell>
											<TableCell className="px-6 py-4 text-xs text-gray-500 font-medium">
												{formatDate(advisor.approvedAt)}
											</TableCell>
											<TableCell className="px-6 py-4">
												<StatusBadge status={advisor.status} />
											</TableCell>
											<TableCell className="px-6 py-4 text-center">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 rounded-full"
														>
															<MoreHorizontal size={16} />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-40">
														<DropdownMenuItem asChild>
															<Link href={`/expert/${advisor._id}`} className="flex items-center gap-2 cursor-pointer">
																<Eye size={14} />
																<span>View Details</span>
															</Link>
														</DropdownMenuItem>
														{normalizeStatus(advisor.status) === "PENDING" && (
															<>
																<DropdownMenuItem
																	onClick={() => openApprove(advisor._id)}
																	disabled={isMutating}
																	className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
																>
																	<Check size={14} />
																	<span>Approve</span>
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => openReject(advisor._id)}
																	disabled={isMutating}
																	className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
																>
																	<X size={14} />
																	<span>Reject</span>
																</DropdownMenuItem>
															</>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
				</div>

				<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold text-gray-400">Items per page</span>
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value));
								setPage(1);
							}}
						>
							<SelectTrigger className="w-24 bg-[#F3F8FF] border-none h-10 rounded-xl text-xs font-bold">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="20">20</SelectItem>
								<SelectItem value="50">50</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<PaginationControls
						page={pagination.safePage}
						onPageChange={setPage}
						totalItems={filteredData.length}
						pageSize={pageSize}
						disabled={isLoading || isError}
					/>
				</div>
			</div>
		</div>
	);
}

export default function ExpertPage() {
	return (
		<React.Suspense
			fallback={
				<div className="flex h-[60vh] items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ExpertPageInner />
		</React.Suspense>
	);
}