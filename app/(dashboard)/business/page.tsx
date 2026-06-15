"use client";

import * as React from "react";
import Link from "next/link";

import api from "@/lib/api";
import type { BusinessProfileType } from "@/lib/api";
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
import { Badge } from "@/components/ui/badge";
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
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { Check, Eye, Loader2, Search, X } from "lucide-react";

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
type ConfirmAction =
	| "approve"
	| "reject"
	| "update-approve"
	| "update-reject";

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
	if (!value) return "-";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleDateString();
}

export default function BusinessPage() {
	const [search, setSearch] = React.useState("");
	const [status, setStatus] = React.useState<StatusFilter>("all");
	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [confirmAction, setConfirmAction] =
		React.useState<ConfirmAction>("approve");
	const [selectedId, setSelectedId] = React.useState<string | null>(null);

	const {
		data: businesses = [],
		isLoading,
		isError,
		error,
	} = api.BusinessProfile.GetList.useQuery();

	const { mutate: approveBusiness, isPending: isApproving } =
		api.BusinessProfile.Approve.useMutation({
			onSuccess: () => setConfirmOpen(false),
		});
	const { mutate: rejectBusiness, isPending: isRejecting } =
		api.BusinessProfile.Reject.useMutation({
			onSuccess: () => setConfirmOpen(false),
		});
	const { mutate: approveUpdate, isPending: isApprovingUpdate } =
		api.BusinessProfile.UpdateApprove.useMutation({
			onSuccess: () => setConfirmOpen(false),
		});
	const { mutate: rejectUpdate, isPending: isRejectingUpdate } =
		api.BusinessProfile.UpdateReject.useMutation({
			onSuccess: () => setConfirmOpen(false),
		});

	const filteredData = React.useMemo(() => {
		const query = search.trim().toLowerCase();
		return (businesses as BusinessProfileType[]).filter((business) => {
			const matchesSearch = query
				? (business.businessName ?? "").toLowerCase().includes(query) ||
					(business.email ?? "").toLowerCase().includes(query) ||
					(business.bphoneNumber ?? "").toLowerCase().includes(query)
				: true;
			const normalized = normalizeStatus(business.status);
			const matchesStatus = status === "all" || normalized === status;
			return matchesSearch && matchesStatus;
		});
	}, [businesses, search, status]);

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

	const openConfirm = (action: ConfirmAction, id: string) => {
		setConfirmAction(action);
		setSelectedId(id);
		setConfirmOpen(true);
	};

	const submitConfirm = () => {
		if (!selectedId) return;
		if (confirmAction === "approve") approveBusiness(selectedId);
		else if (confirmAction === "reject") rejectBusiness(selectedId);
		else if (confirmAction === "update-approve") approveUpdate(selectedId);
		else rejectUpdate(selectedId);
	};

	const isMutating =
		isApproving || isRejecting || isApprovingUpdate || isRejectingUpdate;

	const isUpdateRequestPending = (updateStatus?: string) =>
		normalizeStatus(updateStatus) === "REQUEST_UPDATE" ||
		normalizeStatus(updateStatus) === "PENDING";

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8 space-y-6">
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirmAction === "approve"
								? "Approve business?"
								: confirmAction === "reject"
									? "Reject business?"
									: confirmAction === "update-approve"
										? "Approve profile update?"
										: "Reject profile update?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								submitConfirm();
							}}
							disabled={isMutating}
							className={cn(
								confirmAction === "approve" ||
									confirmAction === "update-approve"
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-red-600 hover:bg-red-700"
							)}
						>
							{isMutating
								? "Please wait…"
								: confirmAction === "approve"
									? "Approve"
									: confirmAction === "reject"
										? "Reject"
										: confirmAction === "update-approve"
											? "Approve update"
											: "Reject update"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="px-4">
				<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
					Business
				</h1>
				<p className="text-zinc-600 text-sm font-medium">
					See all your businesses
				</p>
			</div>

			<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-sm border border-blue-50 min-h-[70vh]">
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
									setStatus(value);
									setPage(1);
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

				{/* Mobile cards */}
				<div className="md:hidden space-y-3">
					{isLoading ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-600">
							<Loader2 className="animate-spin mr-2" /> Loading...
						</div>
					) : isError ? (
						<div className="h-40 flex items-center justify-center text-sm text-red-600 text-center px-2">
							{(error as { response?: { data?: { message?: string } } })
								?.response?.data?.message || "Failed to load businesses"}
						</div>
					) : filteredData.length === 0 ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-500">
							No businesses found.
						</div>
					) : (
						pageData.map((business) => (
							<div
								key={business._id}
								className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
											<p className="text-sm font-bold text-gray-900 truncate">
												{business.businessName || "-"}
										</p>
										<p className="text-xs text-gray-600 truncate">
												{business.email || business.bphoneNumber || "-"}
										</p>
									</div>

									<div className="flex items-center gap-2">
										<Badge
											className={cn(
												"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
												statusBadgeClass(business.status)
											)}
										>
												{normalizeStatus(business.status) || "PENDING"}
										</Badge>
									</div>
								</div>

								<div className="mt-3 grid grid-cols-2 gap-3">
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Approved
										</p>
											<p className="text-xs font-semibold text-gray-700">
												{formatDate(business.approvedAt)}
										</p>
									</div>
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Status
										</p>
											<p className="text-xs font-semibold text-gray-700">
												{normalizeStatus(business.status) || "PENDING"}
										</p>
									</div>
								</div>

								<div className="mt-4 flex items-center gap-2">
									<Button
										asChild
										variant="ghost"
										size="icon"
										title="View details"
										className="h-9 w-9 rounded-xl bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
									>
										<Link href={`/business/${business._id}`}>
											<Eye size={16} />
										</Link>
									</Button>

									{normalizeStatus(business.status) === "PENDING" && (
										<>
											<Button
												variant="ghost"
												size="icon"
												title="Reject"
												onClick={() => openConfirm("reject", business._id)}
												disabled={isMutating}
												className="h-9 w-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
											>
												<X size={16} />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												title="Approve"
												onClick={() => openConfirm("approve", business._id)}
												disabled={isMutating}
												className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
											>
												<Check size={16} />
											</Button>
										</>
									)}
								</div>

								{isUpdateRequestPending(business.updateStatus) && (
									<div className="mt-3 flex items-center gap-2">
										<Button
											variant="outline"
											onClick={() => openConfirm("update-approve", business._id)}
											disabled={isMutating}
											className="h-9 rounded-xl px-3 text-xs"
										>
											Approve Update
										</Button>
										<Button
											variant="outline"
											onClick={() => openConfirm("update-reject", business._id)}
											disabled={isMutating}
											className="h-9 rounded-xl px-3 text-xs text-red-600 border-red-200"
										>
											Reject Update
										</Button>
									</div>
								)}
							</div>
						))
					)}
				</div>

				{/* Desktop table */}
				<div className="hidden md:block rounded-2xl border border-gray-100 overflow-hidden">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-[#D6E6F2]">
								<TableRow className="border-none hover:bg-transparent">
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Name
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Info
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Status
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider text-center">
										View
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider text-center">
										Approval
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider text-center">
										Profile Update
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={6} className="h-40 text-center">
											<Loader2 className="animate-spin inline mr-2" /> Loading...
										</TableCell>
									</TableRow>
								) : isError ? (
									<TableRow>
										<TableCell colSpan={6} className="h-40 text-center text-sm text-red-600">
											{(error as { response?: { data?: { message?: string } } })
												?.response?.data?.message ||
												"Failed to load businesses"}
										</TableCell>
									</TableRow>
								) : filteredData.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="h-40 text-center text-sm text-gray-500">
											No businesses found.
										</TableCell>
									</TableRow>
								) : (
									pageData.map((business) => (
										<TableRow
											key={business._id}
											className="hover:bg-slate-50/50 border-gray-50"
										>
											<TableCell className="px-6 py-4 text-xs font-bold text-gray-600">
												<div className="flex flex-col">
													
													<span className="text-[11px] text-black-800 font-medium truncate">
														{business.name || business.bphoneNumber}
													</span>
												</div>	
											</TableCell>
											<TableCell className="px-6 py-4 text-xs text-gray-500 font-medium">
                        <span className="truncate">{business.businessName}</span>
												Approved: {formatDate(business.approvedAt)}
											</TableCell>
											<TableCell className="px-6 py-4">
												<Badge
													className={cn(
														"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
														statusBadgeClass(business.status)
													)}
												>
													{normalizeStatus(business.status) || "PENDING"}
												</Badge>
											</TableCell>
											<TableCell className="px-6 py-4 text-center">
												<Button
													asChild
													variant="ghost"
													size="icon"
													title="View details"
													className="h-8 w-8 rounded-lg bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
												>
													<Link href={`/business/${business._id}`}>
														<Eye size={16} />
													</Link>
												</Button>
											</TableCell>
											<TableCell className="px-6 py-4">
												{normalizeStatus(business.status) === "PENDING" ? (
													<div className="flex items-center justify-center gap-2">
														<Button
															variant="ghost"
															size="icon"
															title="Approve"
															onClick={() => openConfirm("approve", business._id)}
															disabled={isMutating}
															className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
														>
															<Check size={14} />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															title="Reject"
															onClick={() => openConfirm("reject", business._id)}
															disabled={isMutating}
															className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
														>
															<X size={14} />
														</Button>
													</div>
												) : (
													<span className="text-xs text-gray-400">-</span>
												)}
											</TableCell>
											<TableCell className="px-6 py-4 text-center">
												{isUpdateRequestPending(business.updateStatus) ? (
													<div className="flex items-center justify-center gap-2">
														<Button
															variant="outline"
															className="h-8 px-3 rounded-lg"
															onClick={() => openConfirm("update-approve", business._id)}
															disabled={isMutating}
														>
															<Check size={12} className="mr-1" />
															Approve
														</Button>
														<Button
															variant="outline"
															className="h-8 px-3 rounded-lg text-red-600 border-red-200"
															onClick={() => openConfirm("update-reject", business._id)}
															disabled={isMutating}
														>
															<X size={12} className="mr-1" />
															Reject
														</Button>
													</div>
												) : (
													<span className="text-xs text-gray-400">—</span>
												)}
											</TableCell>
										</TableRow>
									))
								)
								}
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
