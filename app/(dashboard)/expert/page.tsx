"use client";

import * as React from "react";
import Link from "next/link";

import api from "@/lib/api";
import type { AdvisorProfileType } from "@/lib/api";
import PaginationControls from "@/components/shared/PaginationControls";
import { AdminCard } from "@/components/shared/admin/AdminCard";
import { FilterField } from "@/components/shared/admin/FilterField";
import { PageHeader } from "@/components/shared/admin/PageHeader";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	buildDetailHref,
	useCorrectPaginationPage,
	useUrlPagination,
} from "@/hooks/use-url-pagination";
import { getPaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { Check, Eye, Loader2, MoreHorizontal, Search, X } from "lucide-react";

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function statusBadgeClass(status: string) {
	switch (normalizeStatus(status)) {
		case "APPROVED":
			return "bg-[#E6F4EA] text-[#1E8E3E]";
		case "REJECTED":
			return "bg-[#FDECEC] text-[#B91C1C]";
		case "DRAFT":
			return "bg-slate-100 text-slate-600";
		case "PENDING":
		default:
			return "bg-[#FFF7E6] text-[#B45309]";
	}
}

function formatDate(value?: string) {
	if (!value) return "—";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString();
}

const EXPERT_LIST_PATH = "/expert";

function ExpertActionsMenu({
	advisor,
	page,
	pageSize,
	onApprove,
	onReject,
	disabled,
}: {
	advisor: AdvisorProfileType;
	page: number;
	pageSize: number;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	disabled?: boolean;
}) {
	const status = normalizeStatus(advisor.status);
	const showApprove = status === "PENDING" || status === "REJECTED";
	const showReject = status === "PENDING" || status === "APPROVED";
	const showStatusActions = showApprove || showReject;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					disabled={disabled}
					className="h-9 w-9 rounded-lg border border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200/80 hover:text-slate-700"
				>
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Open actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48 rounded-xl">
				<DropdownMenuItem asChild>
					<Link
						href={buildDetailHref(EXPERT_LIST_PATH, advisor._id, page, pageSize)}
						className="flex items-center"
					>
						<Eye className="mr-2 h-4 w-4" />
						View Details
					</Link>
				</DropdownMenuItem>

				{showStatusActions && <DropdownMenuSeparator />}

				{showApprove && (
					<DropdownMenuItem onClick={() => onApprove(advisor._id)}>
						<Check className="mr-2 h-4 w-4 text-emerald-600" />
						Approve
					</DropdownMenuItem>
				)}
				{showReject && (
					<DropdownMenuItem onClick={() => onReject(advisor._id)}>
						<X className="mr-2 h-4 w-4 text-red-600" />
						Reject
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function ExpertPageInner() {
	const [search, setSearch] = React.useState("");
	const [status, setStatus] = React.useState<StatusFilter>("all");
	const { page, pageSize, setPage, setPageSize, resetPagination } =
		useUrlPagination();
	const [approveOpen, setApproveOpen] = React.useState(false);
	const [rejectOpen, setRejectOpen] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);

	const {
		data: advisors = [],
		isLoading,
		isError,
		error,
	} = api.AdvisorProfile.GetList.useQuery();

	const approveMutation = api.AdvisorProfile.Approve.useMutation();
	const rejectMutation = api.AdvisorProfile.Reject.useMutation();

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

	useCorrectPaginationPage({
		isLoading,
		totalItems: filteredData.length,
		page,
		safePage: pagination.safePage,
		setPage,
	});

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
		approveMutation.mutate(selectedId, {
			onSuccess: () => {
				setApproveOpen(false);
				setSelectedId(null);
			},
		});
	};

	const confirmReject = () => {
		if (!selectedId) return;
		rejectMutation.mutate(selectedId, {
			onSuccess: () => {
				setRejectOpen(false);
				setSelectedId(null);
			},
		});
	};

	const renderExpertActions = (advisor: AdvisorProfileType) => (
		<ExpertActionsMenu
			advisor={advisor}
			page={page}
			pageSize={pageSize}
			onApprove={openApprove}
			onReject={openReject}
			disabled={isMutating}
		/>
	);

	const tableHeadClass =
		"h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-8";

	const inputSurfaceClass =
		"bg-slate-50 border border-slate-200/80 h-11 rounded-lg text-sm placeholder:text-slate-400";

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

			<PageHeader title="Expert" description="See all your experts" />

			<AdminCard className="p-4 sm:p-6 md:p-10">
				<div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Search"
							className={cn("pl-11", inputSurfaceClass)}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								resetPagination();
							}}
						/>
					</div>

					<FilterField label="Filter Status">
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
									setStatus(value);
									resetPagination();
								}
							}}
						>
							<SelectTrigger
								className={cn(
									"w-full sm:w-40 md:w-36 text-xs font-semibold",
									inputSurfaceClass
								)}
							>
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
					</FilterField>
				</div>

				{/* Mobile: Card list */}
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
										<Badge
											className={cn(
												"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
												statusBadgeClass(advisor.status)
											)}
										>
											{normalizeStatus(advisor.status) || "PENDING"}
										</Badge>
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
									{renderExpertActions(advisor)}
								</div>
							</div>
						))
					)}
				</div>

				{/* Desktop: Table */}
				<div className="hidden md:block rounded-2xl border border-gray-100 overflow-hidden">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 border-b border-slate-200/80">
								<TableRow className="border-none hover:bg-transparent">
									<TableHead className={tableHeadClass}>Expert</TableHead>
									<TableHead className={tableHeadClass}>Approved Date</TableHead>
									<TableHead className={tableHeadClass}>Status</TableHead>
									<TableHead className={cn(tableHeadClass, "text-center")}>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-40 text-center text-slate-500"
										>
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
										<TableCell
											colSpan={4}
											className="h-40 text-center text-sm text-slate-500"
										>
											No advisors found.
										</TableCell>
									</TableRow>
								) : (
									pageData.map((advisor) => (
										<TableRow
											key={advisor._id}
											className="hover:bg-slate-50/50 border-gray-50"
										>
											<TableCell className="px-6 py-4">
												<div className="flex flex-col">
													<span className="truncate text-slate-900 font-bold">
														{advisor.fullName || "—"}
													</span>
													<span className="truncate text-slate-500 text-xs font-medium">
														{advisor.email || advisor.phoneNumber || "—"}
													</span>
												</div>
											</TableCell>
											<TableCell className="px-6 py-4 text-xs text-gray-500 font-medium">
												{formatDate(advisor.approvedAt)}
											</TableCell>
											<TableCell className="px-6 py-4">
												<Badge
													className={cn(
														"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
														statusBadgeClass(advisor.status)
													)}
												>
													{normalizeStatus(advisor.status) || "PENDING"}
												</Badge>
											</TableCell>
											<TableCell className="px-6 py-4">
												<div className="flex justify-center">
													{renderExpertActions(advisor)}
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</div>

				<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<span className="text-xs font-bold text-gray-400">Items per page</span>
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value));
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
			</AdminCard>
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
