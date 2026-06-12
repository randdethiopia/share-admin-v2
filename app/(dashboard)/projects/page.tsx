"use client";

import * as React from "react";
import api, { getProjectByIdFn, type ProjectStatus, type ProjectType } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getInvestmentByProjectIdFn } from "@/lib/api/investment";
import useAuthStore from "@/store/useAuthStore";
import Cookies from "js-cookie";
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
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
	CheckCircle2,
	Check,
	Clock,
	Eye,
	MoreHorizontal,
	Search,
	Trash2,
	X,
	XCircle,
} from "lucide-react";

type StatusFilter = "all" | ProjectStatus;

function normalizeProjectStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function formatDate(value?: string) {
	if (!value) return "—";
	const d = new Date(value);
	// Guard invalid date values from backend
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString();
}

function statusBadgeClass(status: string) {
	switch (normalizeProjectStatus(status)) {
		case "APPROVED":
			return "bg-[#E6F4EA] text-[#1E8E3E]";
		case "PENDING":
			return "bg-[#FFF7E6] text-[#B45309]";
		case "REJECTED":
			return "bg-[#FDECEC] text-[#B91C1C]";
		case "DRAFT":
			return "bg-slate-100 text-slate-600";
		default:
			return "bg-slate-100 text-slate-600";
	}
}

function statusAccentClass(status: string) {
	switch (normalizeProjectStatus(status)) {
		case "APPROVED":
			return "border-l-[#1E8E3E]";
		case "PENDING":
			return "border-l-[#B45309]";
		case "REJECTED":
			return "border-l-[#B91C1C]";
		case "DRAFT":
			return "border-l-slate-400";
		default:
			return "border-l-slate-300";
	}
}

function StatusIcon({ status }: { status: string }) {
	switch (normalizeProjectStatus(status)) {
		case "APPROVED":
			return <CheckCircle2 className="h-4 w-4" />;
		case "PENDING":
			return <Clock className="h-4 w-4" />;
		case "REJECTED":
			return <XCircle className="h-4 w-4" />;
		default:
			return <Clock className="h-4 w-4" />;
	}
}

function truncateWords(text: string | undefined | null, maxWords: number) {
	const value = (text ?? "").trim();
	if (!value) return "";

	const words = value.split(/\s+/);
	if (words.length <= maxWords) return value;
	return `${words.slice(0, maxWords).join(" ")}...`;
}

function ProjectActionsMenu({
	project,
	onView,
	onApprove,
	onReject,
	onDelete,
	onPrefetch,
	disabled,
}: {
	project: ProjectType;
	onView: (project: ProjectType) => void;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	onDelete: (id: string) => void;
	onPrefetch?: (id: string) => void;
	disabled?: boolean;
}) {
	const status = normalizeProjectStatus(String(project.status ?? ""));
	const showApprove =
		status === "PENDING" || status === "REJECTED" || status === "TRASH";
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
				<DropdownMenuItem
					onClick={() => onView(project)}
					onMouseEnter={() => onPrefetch?.(project._id)}
				>
					<Eye className="mr-2 h-4 w-4" />
					View Details
				</DropdownMenuItem>

				{(showStatusActions || status === "TRASH") && <DropdownMenuSeparator />}

				{showApprove && (
					<DropdownMenuItem onClick={() => onApprove(project._id)}>
						<Check className="mr-2 h-4 w-4 text-emerald-600" />
						Approve
					</DropdownMenuItem>
				)}
				{showReject && (
					<DropdownMenuItem onClick={() => onReject(project._id)}>
						<X className="mr-2 h-4 w-4 text-red-600" />
						Reject
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					onClick={() => onDelete(project._id)}
					className="text-red-600 focus:text-red-700"
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default function ProjectsPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const role = useAuthStore((s) => s.role);
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAdmin = role === "ADMIN";
	const hasToken = Boolean(Cookies.get("session_token"));
	const canFetchProjects = hasHydrated && isAdmin && hasToken;
	const canMutateProjects = hasHydrated && isAdmin && hasToken;
	const [search, setSearch] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
	const [page, setPage] = React.useState(1);
	const [approveId, setApproveId] = React.useState<string | null>(null);
	const [approveOpen, setApproveOpen] = React.useState(false);
	const [rejectId, setRejectId] = React.useState<string | null>(null);
	const [rejectOpen, setRejectOpen] = React.useState(false);
	const [deleteId, setDeleteId] = React.useState<string | null>(null);
	const [deleteOpen, setDeleteOpen] = React.useState(false);
	const pageSize = DEFAULT_PAGE_SIZE;

	const {
		data: projects,
		isLoading,
		isError,
		error,
		refetch,
	} = api.Project.GetList.useQuery({
		enabled: canFetchProjects,
	});

	const approveMutation = api.Project.Approve.useMutation();
	const rejectMutation = api.Project.Reject.useMutation();
	const deleteMutation = api.Project.Delete.useMutation();

	const filteredData = React.useMemo(() => {
		const list = projects ?? [];
		const q = search.trim().toLowerCase();
		return list.filter((p: ProjectType) => {
			const matchText = q
				? (p.projectName ?? "").trim().toLowerCase().startsWith(q)
				: true;
			const normalized = normalizeProjectStatus(String(p.status ?? ""));
			const matchStatus = statusFilter === "all" || normalized === statusFilter;
			return matchText && matchStatus;
		});
	}, [projects, search, statusFilter]);

	const pagination = React.useMemo(
		() => getPaginationMeta(filteredData.length, page, pageSize),
		[filteredData.length, page, pageSize]
	);
	const pageCount = pagination.totalPages;
	const currentPage = pagination.safePage;
	const pagedData = React.useMemo(() => {
		return filteredData.slice(pagination.startIndex, pagination.endIndexExclusive);
	}, [filteredData, pagination.startIndex, pagination.endIndexExclusive]);

	const pageRangeLabel = React.useMemo(() => {
		if (pagination.totalItems === 0) return "0 of 0";
		return `${pagination.showingFrom}-${pagination.showingTo} of ${pagination.totalItems}`;
	}, [pagination.totalItems, pagination.showingFrom, pagination.showingTo]);

	const isMutating =
		approveMutation.isPending ||
		rejectMutation.isPending ||
		deleteMutation.isPending;

	const onView = (project: ProjectType) => {
		router.push(`/projects/${project._id}`);
	};

	const prefetchProjectDetails = (projectId: string) => {
		queryClient.prefetchQuery({
			queryKey: ["Projects", projectId],
			queryFn: () => getProjectByIdFn(projectId),
		});
		queryClient.prefetchQuery({
			queryKey: ["Investments", "project", projectId],
			queryFn: () => getInvestmentByProjectIdFn(projectId),
		});
	};

	const onApprove = (id: string) => {
		if (!id) return;
		setApproveId(id);
		setApproveOpen(true);
	};

	const onReject = (id: string) => {
		if (!id) return;
		setRejectId(id);
		setRejectOpen(true);
	};

	const onDelete = (id: string) => {
		if (!id) return;
		setDeleteId(id);
		setDeleteOpen(true);
	};

	const confirmDelete = () => {
		if (!deleteId) return;
		deleteMutation.mutate(deleteId, {
			onSuccess: () => {
				// Instant UI update even if backend refetch is slow.
				queryClient.setQueryData<ProjectType[]>(["Projects"], (old) =>
					(old ?? []).filter((p) => p._id !== deleteId)
				);
				setDeleteOpen(false);
				setDeleteId(null);
			},
			onError: () => {
				// keep dialog open so user can retry or cancel
			},
		});
	};

	const confirmApprove = () => {
		if (!approveId) return;
		approveMutation.mutate(approveId, {
			onSuccess: () => {
				queryClient.setQueryData<ProjectType[]>(["Projects"], (old) =>
					(old ?? []).map((p) =>
						p._id === approveId ? ({ ...p, status: "APPROVED" } as ProjectType) : p
					)
				);
				setApproveOpen(false);
				setApproveId(null);
			},
		});
	};

	const confirmReject = () => {
		if (!rejectId) return;
		rejectMutation.mutate(rejectId, {
			onSuccess: () => {
				queryClient.setQueryData<ProjectType[]>(["Projects"], (old) =>
					(old ?? []).map((p) =>
						p._id === rejectId ? ({ ...p, status: "REJECTED" } as ProjectType) : p
					)
				);
				setRejectOpen(false);
				setRejectId(null);
			},
		});
	};

	const tableHeadClass =
		"h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-8";

	const inputSurfaceClass =
		"bg-slate-50 border border-slate-200/80 h-11 rounded-lg text-sm placeholder:text-slate-400";

	const renderProjectActions = (project: ProjectType) => (
		<ProjectActionsMenu
			project={project}
			onView={onView}
			onApprove={onApprove}
			onReject={onReject}
			onDelete={onDelete}
			onPrefetch={prefetchProjectDetails}
			disabled={!canMutateProjects || isMutating}
		/>
	);

	return (
		<div className="space-y-6">
			<AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Approve project?</AlertDialogTitle>
						<AlertDialogDescription>
							This will mark the project as approved. This action can’t be undone.
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
						<AlertDialogTitle>Reject project?</AlertDialogTitle>
						<AlertDialogDescription>
							This will mark the project as rejected. This action can’t be undone.
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

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete project?</AlertDialogTitle>
						<AlertDialogDescription>
							This action can’t be undone. The project will be permanently removed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								confirmDelete();
							}}
							disabled={deleteMutation.isPending}
							className="bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending ? "Deleting…" : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<PageHeader title="Projects" description="See all projects" />

			<AdminCard className="min-h-[70vh] p-4 sm:p-6 lg:p-8">
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8">
					<div className="relative w-full lg:max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Search projects..."
							className={cn("pl-11", inputSurfaceClass)}
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
						<FilterField label="Filter Status">
							<Select
								onValueChange={(v) => {
									setStatusFilter(v as StatusFilter);
									setPage(1);
								}}
								defaultValue="all"
							>
								<SelectTrigger
									className={cn(
										"w-full sm:w-40 text-xs font-semibold",
										inputSurfaceClass
									)}
								>
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="PENDING">Pending</SelectItem>
									<SelectItem value="APPROVED">Approved</SelectItem>
									<SelectItem value="REJECTED">Rejected</SelectItem>
									<SelectItem value="DRAFT">Draft</SelectItem>
								</SelectContent>
							</Select>
						</FilterField>
					</div>
				</div>

				<div className="flex items-center justify-between px-1 sm:px-2 mb-3">
					<div className="text-xs font-semibold text-slate-500">Showing {pageRangeLabel}</div>
					<div className="text-xs font-semibold text-slate-400">Page {currentPage} / {pageCount}</div>
				</div>

				<div className="rounded-2xl border border-gray-100 overflow-hidden max-w-full">
				
					<div className="md:hidden p-3 sm:p-4 space-y-3">
						{isLoading ? (
							<div className="space-y-3">
								{Array.from({ length: 6 }).map((_, idx) => (
									<div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0 flex-1 space-y-2">
												<Skeleton className="h-4 w-2/3" />
												<Skeleton className="h-3 w-full" />
											</div>
											<Skeleton className="h-6 w-20 rounded-full" />
										</div>
										<div className="mt-4 flex gap-2">
											<Skeleton className="h-8 w-20 rounded-xl" />
											<Skeleton className="h-8 w-20 rounded-xl" />
											<Skeleton className="h-8 w-20 rounded-xl" />
										</div>
									</div>
								))}
							</div>
						) : isError ? (
							<div className="flex flex-col items-center justify-center h-40 text-center text-sm text-slate-600 gap-3">
								<div>
									<div className="font-semibold text-slate-900">Failed to load projects</div>
									<div className="mt-1">
										{error?.response?.data?.message || "Please try again."}
									</div>
								</div>
								<Button onClick={() => refetch()} variant="outline">
									Retry
								</Button>
							</div>
						) : filteredData.length === 0 ? (
							<div className="flex items-center justify-center h-40 text-sm text-slate-600">
								No projects found.
							</div>
						) : (
							pagedData.map((project) => {
								const status = normalizeProjectStatus(String(project.status ?? ""));
								return (
									<div
										key={project._id}
										className={cn(
											"rounded-2xl border border-slate-100 bg-white p-4 shadow-sm border-l-4",
											statusAccentClass(status)
										)}
									>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="font-semibold text-slate-900 truncate">
												{project.projectName}
											</div>
											<div
												className="mt-1 text-xs text-slate-500"
												title={project.description}
											>
												{truncateWords(project.description, 5)}
											</div>
										</div>
									</div>

									<div className="mt-3 flex items-center justify-between gap-3">
										<div className="text-[11px] font-semibold text-slate-500">Status</div>
										<Badge
											className={cn(
												"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border-none",
												statusBadgeClass(status)
											)}
										>
											<StatusIcon status={status} />
											{status}
										</Badge>
									</div>

									<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
										<span>
											<span className="font-semibold">from:</span> {formatDate(project.startDate)}
										</span>
										<span className="text-slate-300">•</span>
										<span>
											<span className="font-semibold">to:</span> {formatDate(project.endDate)}
										</span>
									</div>

										<div className="mt-4 flex items-center justify-end">
											{renderProjectActions(project)}
										</div>
									</div>
								);
							})
						)}

						<PaginationControls
							page={page}
							onPageChange={setPage}
							totalItems={filteredData.length}
							pageSize={pageSize}
							disabled={isLoading || isError}
							className="pt-2"
						/>
					</div>

					<div className="hidden md:block w-full overflow-x-auto">
						<Table className="w-full min-w-190 md:min-w-0">
						<TableHeader className="bg-slate-50 border-b border-slate-200/80">
							<TableRow className="border-none hover:bg-transparent">
									<TableHead className={tableHeadClass}>Info</TableHead>
									<TableHead className={cn(tableHeadClass, "hidden md:table-cell")}>
										Due Date
									</TableHead>
									<TableHead className={tableHeadClass}>Status</TableHead>
									<TableHead className={cn(tableHeadClass, "text-center")}>
										Actions
									</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							{isLoading ? (
								Array.from({ length: 8 }).map((_, idx) => (
									<TableRow key={idx}>
										<TableCell className="px-3 sm:px-6 py-4 sm:py-5">
											<div className="space-y-2">
												<Skeleton className="h-4 w-2/3" />
												<Skeleton className="h-3 w-full" />
											</div>
										</TableCell>
										<TableCell className="hidden md:table-cell px-3 sm:px-6 py-4 sm:py-5">
											<div className="space-y-2">
												<Skeleton className="h-3 w-24" />
												<Skeleton className="h-3 w-24" />
											</div>
										</TableCell>
										<TableCell className="px-3 sm:px-6 py-4 sm:py-5">
											<Skeleton className="h-6 w-20 rounded-full" />
										</TableCell>
										<TableCell className="px-3 sm:px-6 py-4 sm:py-5">
											<div className="flex justify-center gap-2">
												<Skeleton className="h-8 w-8 rounded-lg" />
												<Skeleton className="h-8 w-8 rounded-lg" />
												<Skeleton className="h-8 w-8 rounded-lg" />
												<Skeleton className="h-8 w-8 rounded-lg" />
											</div>
										</TableCell>
									</TableRow>
								))
							) : isError ? (
								<TableRow>
									<TableCell colSpan={4} className="h-40 text-center text-sm text-slate-600">
										<div className="font-semibold text-slate-900 mb-2">Failed to load projects</div>
										<div className="mb-4">{error?.response?.data?.message || "Please try again."}</div>
										<Button onClick={() => refetch()} variant="outline">
											Retry
										</Button>
									</TableCell>
								</TableRow>
							) : filteredData.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="h-40 text-center text-sm text-slate-500"
									>
										No projects found.
									</TableCell>
								</TableRow>
							) : (
								pagedData.map((project) => {
									const status = normalizeProjectStatus(String(project.status ?? ""));
									return (
										<TableRow
											key={project._id}
											className="hover:bg-slate-50/50 border-gray-50"
										>
										<TableCell className="px-3 sm:px-6 py-4 sm:py-5">
											<div className="font-bold text-slate-900">{project.projectName}</div>
											<div
												className="text-xs text-slate-400"
												title={project.description}
											>
												{truncateWords(project.description, 5)}
											</div>
											<div className="mt-1 text-[11px] text-slate-400 md:hidden">
												<span className="font-semibold">from:</span> {formatDate(project.startDate)}
												<span className="mx-2">•</span>
												<span className="font-semibold">to:</span> {formatDate(project.endDate)}
											</div>
										</TableCell>

										<TableCell className="hidden md:table-cell px-3 sm:px-6 py-4 sm:py-5 text-xs whitespace-nowrap">
											<div className="mb-1">
												<span className="text-slate-400 font-bold mr-2">from:</span>
												{formatDate(project.startDate)}
											</div>
											<div>
												<span className="text-slate-400 font-bold mr-2">to:</span>
												{formatDate(project.endDate)}
											</div>
										</TableCell>

										<TableCell className="px-3 sm:px-6 py-4 sm:py-5">
											<Badge
												className={cn(
													"rounded-full px-3 py-1 text-[10px] font-bold border-none",
													statusBadgeClass(status)
												)}
											>
												{status}
											</Badge>
										</TableCell>

										<TableCell className="px-3 sm:px-6 py-4 sm:py-5">
											<div className="flex justify-center">
												{renderProjectActions(project)}
											</div>
										</TableCell>
									</TableRow>
								);
							})
							)}
						</TableBody>
						</Table>

						<div className="p-3 sm:p-4 border-t bg-white">
							<PaginationControls
								page={page}
								onPageChange={setPage}
								totalItems={filteredData.length}
								pageSize={pageSize}
								disabled={isLoading || isError}
								className="mt-0"
								showRange={false}
							/>
						</div>
					</div>
				</div>
			</AdminCard>
		</div>
	);
}
