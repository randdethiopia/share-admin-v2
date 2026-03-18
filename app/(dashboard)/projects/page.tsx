"use client";

import * as React from "react";
import ProjectApi, { getProjectByIdFn, type ProjectStatus, type ProjectType } from "@/api/project";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getInvestmentByProjectIdFn } from "@/api/investment";
import useAuthStore from "@/store/useAuthStore";
import Cookies from "js-cookie";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	Loader2,
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
		isFetching,
	} = ProjectApi.GetList.useQuery({
		enabled: canFetchProjects,
	});

	const approveMutation = ProjectApi.Approve.useMutation();
	const rejectMutation = ProjectApi.Reject.useMutation();
	const deleteMutation = ProjectApi.Delete.useMutation();

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
		approveMutation.mutate(id, {
			onSuccess: () => {
				queryClient.setQueryData<ProjectType[]>(["Projects"], (old) =>
					(old ?? []).map((p) =>
						p._id === id ? ({ ...p, status: "APPROVED" } as ProjectType) : p
					)
				);
			},
		});
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

	const getApproveTitle = (status: string) => {
		if (!hasHydrated) return "Loading…";
		if (!isAdmin) return "Admins only";
		return status === "APPROVED" ? "Approve again" : "Approve";
	};

	const getRejectTitle = (status: string) => {
		if (!hasHydrated) return "Loading…";
		if (!isAdmin) return "Admins only";
		return status === "REJECTED" ? "Reject again" : "Reject";
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

	return (
		<div className="space-y-6">
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
			<div className="px-4">
				<h1 className="text-[28px] font-bold text-black">Projects</h1>
				<p className="text-zinc-600 text-lg">See all projects</p>
			</div>

			<div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-sm border border-blue-50 max-w-full">
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8">
					<div className="relative w-full lg:max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search projects..."
							className="pl-10 bg-[#F3F8FF] border-none h-12 rounded-xl"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
						<span className="text-sm font-bold text-gray-500">Filter</span>
						<Select
							onValueChange={(v) => {
								setStatusFilter(v as StatusFilter);
								setPage(1);
							}}
							defaultValue="all"
						>
							<SelectTrigger className="w-full sm:w-40 bg-[#F3F8FF] border-none h-12 rounded-xl">
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

						<Button
							variant="outline"
							className="h-12 rounded-xl"
							onClick={() => refetch()}
							disabled={isFetching}
						>
							{isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							Refresh
						</Button>
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

										<div className="mt-4 flex items-center gap-2">
											<Button
												variant="ghost"
												size="icon"
												className="h-9 w-9 rounded-xl bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
												onClick={() => onView(project)}
												onMouseEnter={() => prefetchProjectDetails(project._id)}
												aria-label="View project"
												title="View"
											>
												<Eye size={16} />
											</Button>

											<Button
												variant="ghost"
												size="icon"
												className="h-9 w-9 rounded-xl bg-[#E6F4EA] text-[#1E8E3E] hover:bg-emerald-100"
												onClick={() => onApprove(project._id)}
												disabled={!canMutateProjects || isMutating}
												aria-label="Approve project"
												title={getApproveTitle(status)}
											>
												<Check size={18} />
											</Button>

											<Button
												variant="ghost"
												size="icon"
												className="h-9 w-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
												onClick={() => onReject(project._id)}
												disabled={!canMutateProjects || isMutating}
												aria-label="Reject project"
												title={getRejectTitle(status)}
											>
												<X size={18} />
											</Button>

											<Button
												variant="ghost"
												size="icon"
												className="h-9 w-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
												onClick={() => onDelete(project._id)}
												disabled={!canMutateProjects || isMutating}
												aria-label="Delete project"
												title="Delete"
											>
													<Trash2 size={18} />
											</Button>
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
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="hover:bg-transparent border-none">
									<TableHead className="font-bold text-slate-700 h-14 px-3 sm:px-6">Info</TableHead>
									<TableHead className="hidden md:table-cell font-bold text-slate-700 h-14 px-3 sm:px-6">Due Date</TableHead>
									<TableHead className="font-bold text-slate-700 h-14 px-3 sm:px-6">Status</TableHead>
									<TableHead className="font-bold text-slate-700 h-14 px-3 sm:px-6 text-center">Actions</TableHead>
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
									<TableCell colSpan={4} className="h-40 text-center text-sm text-slate-600">
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
											<div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
													onClick={() => onView(project)}
													onMouseEnter={() => prefetchProjectDetails(project._id)}
													aria-label="View project"
												>
													<Eye size={16} />
												</Button>

														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#E6F4EA] text-[#1E8E3E] hover:bg-emerald-100"
															onClick={() => onApprove(project._id)}
															disabled={!canMutateProjects || isMutating}
															aria-label="Approve project"
															title={getApproveTitle(status)}
														>
															<Check size={16} />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
															onClick={() => onReject(project._id)}
															disabled={!canMutateProjects || isMutating}
															aria-label="Reject project"
															title={getRejectTitle(status)}
														>
															<X size={16} />
														</Button>

												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
													onClick={() => onDelete(project._id)}
															disabled={!canMutateProjects || isMutating}
													aria-label="Delete project"
												>
															<Trash2 size={16} />
												</Button>
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
			</div>
		</div>
	);
}
