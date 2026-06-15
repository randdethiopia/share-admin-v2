
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import api, { type InvestmentType, type ProjectGallery, type ProjectUpdate } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { DetailPageSkeleton } from "@/components/shared/page-skeletons";
import { AdminCard } from "@/components/shared/admin/AdminCard";
import { PageHeader } from "@/components/shared/admin/PageHeader";

import {
	ArrowLeft,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Image as ImageIcon,
	Loader2,
	MoreHorizontal,
	Target,
	Trash2,
	X,
	XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

function toId(value: string | string[] | undefined) {
	if (!value) return "";
	return Array.isArray(value) ? value[0] ?? "" : value;
}

function formatDate(value?: string | Date | null) {
	if (!value) return "—";
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function formatCurrencyETB(amount?: number) {
	const value = typeof amount === "number" ? amount : 0;
	return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(value);
}

function statusBadgeClass(status: string) {
	switch (status) {
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

function timelineDotIcon(status: string) {
	switch (status) {
		case "APPROVED":
			return <CheckCircle2 className="h-4 w-4" />;
		case "REJECTED":
			return <XCircle className="h-4 w-4" />;
		default:
			return <Clock className="h-4 w-4" />;
	}
}

function normalizeProjectStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

type ProjectConfirmAction = "approve" | "reject" | "delete";

function ProjectLifecycleMenu({
	status,
	onConfirmAction,
	disabled,
}: {
	status: string;
	onConfirmAction: (action: ProjectConfirmAction) => void;
	disabled?: boolean;
}) {
	const showApprove = status === "PENDING" || status === "REJECTED";
	const showReject = status === "PENDING" || status === "APPROVED";
	const showDelete = status !== "TRASH";
	const showStatusActions = showApprove || showReject;

	if (!showApprove && !showReject && !showDelete) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					disabled={disabled}
					className="h-11 w-11 rounded-lg border border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200/80 hover:text-slate-700"
				>
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Open project actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-52 rounded-xl">
				{showApprove && (
					<DropdownMenuItem onClick={() => onConfirmAction("approve")}>
						<CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
						Approve Project
					</DropdownMenuItem>
				)}
				{showReject && (
					<DropdownMenuItem onClick={() => onConfirmAction("reject")}>
						<X className="mr-2 h-4 w-4 text-red-600" />
						Reject Project
					</DropdownMenuItem>
				)}
				{showStatusActions && showDelete && <DropdownMenuSeparator />}
				{showDelete && (
					<DropdownMenuItem
						onClick={() => onConfirmAction("delete")}
						className="text-red-600 focus:text-red-700"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete Project
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default function ProjectDetailPage() {
	const params = useParams();
	const router = useRouter();
	const queryClient = useQueryClient();
	const id = toId((params as Record<string, string | string[] | undefined>)?.id);

	const [approveOpen, setApproveOpen] = React.useState(false);
	const [dueDate, setDueDate] = React.useState("");
	const [projectConfirmOpen, setProjectConfirmOpen] = React.useState(false);
	const [projectConfirmAction, setProjectConfirmAction] =
		React.useState<ProjectConfirmAction | null>(null);

	const { data: project, isLoading: isProjLoading } =
		api.Project.GetById.useQuery(id);
	const { data: investments, isLoading: isInvLoading } =
		api.Investment.GetByProjectId.useQuery(id);

	const approveInvestment = api.Investment.Approve.useMutation();
	const approveProject = api.Project.Approve.useMutation();
	const rejectProject = api.Project.Reject.useMutation();
	const deleteProject = api.Project.Delete.useMutation();

	const approveUpdate = api.Project.ApproveUpdate.useMutation();
	const rejectUpdate = api.Project.RejectUpdate.useMutation();

	const pendingInvestments = React.useMemo(
		() => (investments ?? []).filter((inv) => inv.status === "PENDING"),
		[investments]
	);

	const isLoading = isProjLoading || isInvLoading;
	const isMutating =
		approveInvestment.isPending ||
		approveProject.isPending ||
		rejectProject.isPending ||
		deleteProject.isPending ||
		approveUpdate.isPending ||
		rejectUpdate.isPending;

	const isProjectLifecycleMutating =
		approveProject.isPending || rejectProject.isPending || deleteProject.isPending;

	const tableHeadClass =
		"h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-8";

	const inputSurfaceClass =
		"bg-slate-50 border border-slate-200/80 h-11 rounded-lg text-sm";

	if (!id) {
		return (
			<div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
				Invalid project id
			</div>
		);
	}

	if (isLoading) {
		return <DetailPageSkeleton />;
	}

	if (!project) {
		return <div className="p-6">Project not found</div>;
	}

	const onOpenApprove = () => {
		setApproveOpen(true);
	};

	const onConfirmApprove = () => {
		if (!dueDate) return;
		approveInvestment.mutate(
			{ projectId: id, dueDate },
			{
				onSuccess: () => {
					setApproveOpen(false);
					setDueDate("");
				},
			}
		);
	};

	const openProjectConfirm = (action: ProjectConfirmAction) => {
		setProjectConfirmAction(action);
		setProjectConfirmOpen(true);
	};

	const confirmProjectLifecycle = () => {
		if (!projectConfirmAction) return;
		const action = projectConfirmAction;

		const onSuccess = () => {
			setProjectConfirmOpen(false);
			setProjectConfirmAction(null);
			queryClient.invalidateQueries({ queryKey: ["Projects"] });
			queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
			if (action === "delete") {
				router.push("/projects");
			}
		};

		if (action === "approve") {
			approveProject.mutate(id, { onSuccess });
		} else if (action === "reject") {
			rejectProject.mutate(id, { onSuccess });
		} else {
			deleteProject.mutate(id, { onSuccess });
		}
	};

	const projectStatus = normalizeProjectStatus(String(project.status ?? ""));

	return (
		<div className="space-y-6">
			<AlertDialog
				open={projectConfirmOpen}
				onOpenChange={(open) => {
					setProjectConfirmOpen(open);
					if (!open) setProjectConfirmAction(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{projectConfirmAction === "approve"
								? "Approve project?"
								: projectConfirmAction === "reject"
									? "Reject project?"
									: "Delete project?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{projectConfirmAction === "approve"
								? "This will mark the project as approved."
								: projectConfirmAction === "reject"
									? "This will mark the project as rejected. This action can't be undone."
									: "This action can't be undone. The project will be permanently removed."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isProjectLifecycleMutating}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								confirmProjectLifecycle();
							}}
							disabled={isProjectLifecycleMutating}
							className={
								projectConfirmAction === "approve"
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-red-600 hover:bg-red-700"
							}
						>
							{isProjectLifecycleMutating
								? projectConfirmAction === "approve"
									? "Approving…"
									: projectConfirmAction === "reject"
										? "Rejecting…"
										: "Deleting…"
								: projectConfirmAction === "approve"
									? "Approve"
									: projectConfirmAction === "reject"
										? "Reject"
										: "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="space-y-3">
					<button
						onClick={() => router.back()}
						type="button"
						className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
					>
						<ArrowLeft className="h-4 w-4" /> Back
					</button>
					<PageHeader
						title={project.projectName}
						description="Project Command Center"
					/>
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							className={cn(
								"rounded-full px-3 py-1 text-[10px] font-bold border-none",
								statusBadgeClass(project.status)
							)}
						>
							{project.status}
						</Badge>
						<Badge className="rounded-full px-3 py-1 text-[10px] font-bold border-none bg-slate-100 text-slate-600">
							Fund: {project.fundStatus}
						</Badge>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row gap-2 shrink-0 items-center">
					<Button
						variant="outline"
						className="h-11 rounded-lg"
						onClick={() => router.push(`/projects/${id}/reinvest`)}
					>
						Reinvest
					</Button>
					<Button
						className="h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700"
						onClick={onOpenApprove}
						disabled={pendingInvestments.length === 0 || isMutating}
					>
						Approve Investments
					</Button>
					<ProjectLifecycleMenu
						status={projectStatus}
						onConfirmAction={openProjectConfirm}
						disabled={isMutating}
					/>
				</div>
			</div>

			<AdminCard className="p-4 sm:p-8">
				<div className="flex items-center justify-between gap-3 mb-6">
					<h3 className="text-lg font-bold text-slate-900">Project Investments</h3>
					<Badge className="rounded-full px-3 py-1 text-[10px] font-bold border-none bg-slate-100 text-slate-600">
						{(investments ?? []).length} total
					</Badge>
				</div>

				<div className="rounded-xl border border-slate-200/80 overflow-hidden">
					<Table>
						<TableHeader className="bg-slate-50 border-b border-slate-200/80">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className={tableHeadClass}>Investor</TableHead>
								<TableHead className={tableHeadClass}>Amount</TableHead>
								<TableHead className={tableHeadClass}>Status</TableHead>
								<TableHead className={tableHeadClass}>Date</TableHead>
								<TableHead className={cn(tableHeadClass, "text-right")}>
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{(investments ?? []).length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="py-10 text-center text-sm text-slate-500"
									>
										No investments for this project.
									</TableCell>
								</TableRow>
							) : (
								(investments ?? []).map((inv: InvestmentType) => (
									<TableRow key={inv._id}>
										<TableCell className="font-bold text-slate-900">
											{inv.investor?.fullName || "—"}
										</TableCell>
										<TableCell className="font-medium text-slate-700">
											{formatCurrencyETB(inv.amount)}
										</TableCell>
										<TableCell>
											<Badge
												className={cn(
													"rounded-full px-3 py-1 text-[10px] font-bold border-none",
													statusBadgeClass(inv.status)
												)}
											>
												{inv.status}
											</Badge>
										</TableCell>
										<TableCell className="text-slate-500 text-xs">
											{formatDate(inv.createdAt as string)}
										</TableCell>
										<TableCell className="text-right">
											{inv.status === "PENDING" ? (
												<Button
													size="sm"
													onClick={onOpenApprove}
													className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700"
													disabled={isMutating}
												>
													Approve
												</Button>
											) : (
												<span className="text-xs text-slate-400">—</span>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</AdminCard>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<AdminCard className="lg:col-span-2 p-4 sm:p-8">
					<h3 className="text-lg font-bold text-slate-900 mb-6">Gallery</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{(project.projectGallery ?? []).length === 0 ? (
							<div className="col-span-full text-sm text-slate-500">
								No images.
							</div>
						) : (
							project.projectGallery.map((img: ProjectGallery, i: number) => (
								<div
									key={i}
									className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80"
								>
									{img?.url ? (
										<img
											src={img.url}
											alt=""
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="flex items-center justify-center h-full">
											<ImageIcon className="text-slate-300" />
										</div>
									)}
								</div>
							))
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-10 border-t border-slate-200/80 pt-8">
						<div className="space-y-1">
							<p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
								<Target size={12} /> Funding Goal
							</p>
							<p className="text-xl font-bold text-slate-900">
								{project.fundingGoal} ETB
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
								<Building2 size={12} /> SME Business
							</p>
							<p className="text-slate-900 font-semibold">
								{project.company?.businessName || "—"}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
								<Calendar size={12} /> Start
							</p>
							<p className="text-slate-900 font-semibold">{formatDate(project.startDate)}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
								<Calendar size={12} /> End
							</p>
							<p className="text-slate-900 font-semibold">{formatDate(project.endDate)}</p>
						</div>
					</div>
				</AdminCard>

				<AdminCard className="p-4 sm:p-8">
					<h3 className="text-lg font-bold text-slate-900 mb-8">Timeline</h3>
					<div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent">
						{(project.projectUpdates ?? []).length === 0 ? (
							<div className="text-sm text-slate-500">No updates.</div>
						) : (
							project.projectUpdates.map((update: ProjectUpdate) => (
								<div key={update._id} className="relative flex items-start gap-4">
									<div
										className={cn(
											"absolute left-0 w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 border-2",
											update.status === "APPROVED"
												? "bg-emerald-50 border-emerald-600 text-emerald-700"
												: update.status === "REJECTED"
													? "bg-red-50 border-red-600 text-red-700"
													: "bg-blue-50 border-blue-600 text-blue-600"
										)}
										aria-hidden
									>
										{timelineDotIcon(update.status)}
									</div>
									<div className="pl-14 flex-1">
										<div className="flex justify-between items-start gap-3">
											<h4 className="font-bold text-slate-900">{update.title}</h4>
											<span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">
												{update.status}
											</span>
										</div>
										<p className="text-[10px] text-slate-500 font-bold">
											{formatDate(update.date)}
										</p>
										<div
											className="text-xs text-slate-600 mt-2 line-clamp-3"
											dangerouslySetInnerHTML={{ __html: update.description ?? "" }}
										/>
										{update.status === "PENDING" && (
											<div className="flex gap-4 mt-4">
												<button
													type="button"
													className="text-emerald-600 text-[10px] font-bold uppercase hover:underline flex items-center gap-1 disabled:opacity-50"
													onClick={() =>
														approveUpdate.mutate({ pid: id, id: update._id })
													}
													disabled={isMutating}
												>
													<CheckCircle2 size={12} /> Approve
												</button>
												<button
													type="button"
													className="text-red-500 text-[10px] font-bold uppercase hover:underline flex items-center gap-1 disabled:opacity-50"
													onClick={() =>
														rejectUpdate.mutate({ pid: id, id: update._id })
													}
													disabled={isMutating}
												>
													<XCircle size={12} /> Reject
												</button>
											</div>
										)}
									</div>
								</div>
							))
						)}
					</div>
				</AdminCard>
			</div>

			<Dialog open={approveOpen} onOpenChange={setApproveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Approve investments</DialogTitle>
						<DialogDescription>
							Set a due date for the investment return. This action approves pending
							investments for this project.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-700">Due date</label>
						<Input
							type="date"
							className={inputSurfaceClass}
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							className="rounded-lg"
							onClick={() => setApproveOpen(false)}
							disabled={approveInvestment.isPending}
						>
							Cancel
						</Button>
						<Button
							className="rounded-lg bg-emerald-600 hover:bg-emerald-700"
							onClick={onConfirmApprove}
							disabled={!dueDate || approveInvestment.isPending}
						>
							{approveInvestment.isPending ? (
								<span className="inline-flex items-center">
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Approving...
								</span>
							) : (
								"Confirm"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

