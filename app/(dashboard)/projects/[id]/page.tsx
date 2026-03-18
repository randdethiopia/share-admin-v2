
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import ProjectApi, { type ProjectGallery, type ProjectUpdate } from "@/api/project";
import InvestmentApi, { type InvestmentType } from "@/api/investment";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import {
	ArrowLeft,
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	Image as ImageIcon,
	Loader2,
	Target,
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

export default function ProjectDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = toId((params as Record<string, string | string[] | undefined>)?.id);

	const [approveOpen, setApproveOpen] = React.useState(false);
	const [dueDate, setDueDate] = React.useState("");

	const { data: project, isLoading: isProjLoading } =
		ProjectApi.GetById.useQuery(id);
	const { data: investments, isLoading: isInvLoading } =
		InvestmentApi.GetByProjectId.useQuery(id);

	const approveInvestment = InvestmentApi.Approve.useMutation({
		onSuccess: () => {
			setApproveOpen(false);
			setDueDate("");
		},
	});

	const approveUpdate = ProjectApi.ApproveUpdate.useMutation();
	const rejectUpdate = ProjectApi.RejectUpdate.useMutation();

	const pendingInvestments = React.useMemo(
		() => (investments ?? []).filter((inv) => inv.status === "PENDING"),
		[investments]
	);

	const isLoading = isProjLoading || isInvLoading;
	const isMutating =
		approveInvestment.isPending || approveUpdate.isPending || rejectUpdate.isPending;

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
		approveInvestment.mutate({ projectId: id, dueDate });
	};

	return (
		<div className="space-y-8 p-4 sm:p-6">
			
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between px-2 sm:px-4">
				<div className="space-y-1">
					<button
						onClick={() => router.back()}
						type="button"
						className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline"
					>
						<ArrowLeft size={14} /> Back
					</button>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 uppercase">
						{project.projectName}
					</h1>
					<p className="text-gray-500 font-medium">Project Command Center</p>
					<div className="mt-2 flex flex-wrap items-center gap-2">
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

				<div className="flex flex-col sm:flex-row gap-2">
					<Button
						variant="outline"
						className="rounded-xl h-11"
						onClick={() => router.push(`/projects/${id}/reinvest`)}
					>
						Reinvest
					</Button>
					<Button
						className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11"
						onClick={onOpenApprove}
						disabled={pendingInvestments.length === 0 || isMutating}
					>
						Approve Investments
					</Button>
				</div>
			</div>

			
			<Card className="rounded-[2rem] sm:rounded-[2.5rem] border-none shadow-sm overflow-hidden">
				<CardContent className="p-4 sm:p-8">
					<div className="flex items-center justify-between gap-3 mb-6">
						<h3 className="text-lg font-bold text-gray-800">Project Investments</h3>
						<Badge className="rounded-full px-3 py-1 text-[10px] font-bold border-none bg-slate-100 text-slate-600">
							{(investments ?? []).length} total
						</Badge>
					</div>

					<div className="rounded-2xl border border-gray-100 overflow-hidden">
						<Table>
							<TableHeader className="bg-[#D6E6F2]">
								<TableRow className="border-none">
									<TableHead className="font-bold">Investor</TableHead>
									<TableHead className="font-bold">Amount</TableHead>
									<TableHead className="font-bold">Status</TableHead>
									<TableHead className="font-bold">Date</TableHead>
									<TableHead className="font-bold text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{(investments ?? []).length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="py-10 text-center text-sm text-muted-foreground"
										>
											No investments for this project.
										</TableCell>
									</TableRow>
								) : (
									(investments ?? []).map((inv: InvestmentType) => (
										<TableRow key={inv._id}>
											<TableCell className="font-bold">
												{inv.investor?.fullName || "—"}
											</TableCell>
											<TableCell className="font-medium text-blue-600">
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
											<TableCell className="text-gray-400 text-xs">
												{formatDate(inv.createdAt as string)}
											</TableCell>
											<TableCell className="text-right">
												{inv.status === "PENDING" ? (
													<Button
														size="sm"
														onClick={onOpenApprove}
														className="bg-blue-600 text-white h-8 rounded-lg"
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
				</CardContent>
			</Card>

			
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
				<Card className="lg:col-span-2 rounded-[2rem] sm:rounded-[2.5rem] border-none shadow-sm p-4 sm:p-8">
					<h3 className="text-lg font-bold mb-6">Gallery</h3>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{(project.projectGallery ?? []).length === 0 ? (
							<div className="col-span-full text-sm text-muted-foreground">
								No images.
							</div>
						) : (
							project.projectGallery.map((img: ProjectGallery, i: number) => (
								<div
									key={i}
									className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border"
								>
									{img?.url ? (
										<img
											src={img.url}
											alt=""
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="flex items-center justify-center h-full">
											<ImageIcon className="text-gray-300" />
										</div>
									)}
								</div>
							))
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-10 border-t pt-8">
						<div className="space-y-1">
							<p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
								<Target size={12} /> Funding Goal
							</p>
							<p className="text-xl font-bold text-blue-600">
								{project.fundingGoal} ETB
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
								<Building2 size={12} /> SME Business
							</p>
							<p className="text-gray-700 font-semibold">
								{project.company?.businessName || "—"}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
								<Calendar size={12} /> Start
							</p>
							<p className="text-gray-700 font-semibold">{formatDate(project.startDate)}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
								<Calendar size={12} /> End
							</p>
							<p className="text-gray-700 font-semibold">{formatDate(project.endDate)}</p>
						</div>
					</div>
				</Card>

				<Card className="rounded-[2rem] sm:rounded-[2.5rem] border-none shadow-sm p-4 sm:p-8">
					<h3 className="text-lg font-bold mb-8">Timeline</h3>
					<div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent">
						{(project.projectUpdates ?? []).length === 0 ? (
							<div className="text-sm text-muted-foreground">No updates.</div>
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
										)
									}
										aria-hidden
									>
										{timelineDotIcon(update.status)}
									</div>
									<div className="pl-14 flex-1">
										<div className="flex justify-between items-start gap-3">
											<h4 className="font-bold text-gray-900">{update.title}</h4>
											<span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-bold">
												{update.status}
											</span>
										</div>
										<p className="text-[10px] text-blue-500 font-bold">
											{formatDate(update.date)}
										</p>
										<div
											className="text-xs text-gray-500 mt-2 line-clamp-3"
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
				</Card>
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
						<label className="text-sm font-medium">Due date</label>
						<Input
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setApproveOpen(false)}
							disabled={approveInvestment.isPending}
						>
							Cancel
						</Button>
						<Button
							className="bg-blue-600 hover:bg-blue-700"
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

