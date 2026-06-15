"use client";

import * as React from "react";
import { Check, DollarSign, Globe, Loader2, Search, X, Briefcase } from "lucide-react";

import api from "@/lib/api";
import {MentorProfileType} from "@/lib/api/mentor-profile";
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
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";
type ConfirmAction = "approve" | "reject";

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function statusBadgeClass(status?: string) {
	switch (normalizeStatus(status)) {
		case "APPROVED":
			return "bg-[#E6F4EA] text-[#1E8E3E]";
		case "REJECTED":
			return "bg-[#FDECEC] text-[#B91C1C]";
		case "PENDING":
		default:
			return "bg-[#FFF7E6] text-[#B45309]";
	}
}

function formatDate(value?: string | null) {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "-";
	return date.toLocaleDateString();
}

function formatCompactNumber(value?: string) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return "-";
	return new Intl.NumberFormat("en-US", { notation: "compact" }).format(parsed);
}

export default function MentorProfilePage() {
	const [search, setSearch] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [actionType, setActionType] =
		React.useState<ConfirmAction>("approve");

	const {
		data: mentors = [],
		isLoading,
		isError,
		error,
	} = api.MentorProfile.GetList.useQuery();

	const { mutate: approve, isPending: isApproving } =
		api.MentorProfile.Approve.useMutation({
			onSuccess: () => setConfirmOpen(false),
		});
	const { mutate: reject, isPending: isRejecting } =
		api.MentorProfile.Reject.useMutation({
			onSuccess: () => setConfirmOpen(false),
		});

	const isMutating = isApproving || isRejecting;

	const filteredMentors = React.useMemo(() => {
		const query = search.trim().toLowerCase();
		return (mentors as MentorProfileType[]).filter((mentor) => {
			const matchesSearch = query
				? (mentor.fullName ?? "").toLowerCase().includes(query) ||
					(mentor.email ?? "").toLowerCase().includes(query) ||
					(mentor.phoneNumber ?? "").toLowerCase().includes(query)
				: true;
			const matchesStatus =
				statusFilter === "all" ||
				normalizeStatus(mentor.status) === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [mentors, search, statusFilter]);

	const openConfirm = (action: ConfirmAction, id: string) => {
		setActionType(action);
		setSelectedId(id);
		setConfirmOpen(true);
	};

	const handleAction = () => {
		if (!selectedId) return;
		if (actionType === "approve") approve(selectedId);
		else reject(selectedId);
	};

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8 space-y-6">
			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{actionType === "approve"
								? "Approve mentor?"
								: "Reject mentor?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isMutating}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleAction();
							}}
							disabled={isMutating}
							className={
								actionType === "approve"
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-red-600 hover:bg-red-700"
							}
						>
							{isMutating
								? "Please wait…"
								: actionType === "approve"
									? "Approve"
									: "Reject"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="px-4">
				<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
					Mentor
				</h1>
				<p className="text-zinc-600 text-sm font-medium">
					Manage and verify mentor profiles
				</p>
			</div>

			<AdminCard className="p-4 sm:p-6 md:p-8">
				<div className="mb-8 flex flex-col justify-between gap-4 md:flex-row">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search mentor name"
							className="pl-11 bg-[#F3F8FF] border-none h-12 rounded-xl text-sm"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-3">
						<span className="text-xs font-bold text-gray-400">Sort By</span>
						<Select
							value={statusFilter}
							onValueChange={(value) =>
								setStatusFilter(value as StatusFilter)
							}
						>
							<SelectTrigger className="w-full sm:w-40 md:w-35 bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold">
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="PENDING">Pending</SelectItem>
								<SelectItem value="APPROVED">Approved</SelectItem>
								<SelectItem value="REJECTED">Rejected</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="md:hidden space-y-4">
					{isLoading ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-600">
							<Loader2 className="animate-spin mr-2" /> Loading mentors...
						</div>
					) : isError ? (
						<div className="h-40 flex items-center justify-center text-sm text-red-600 text-center px-2">
							{(error as { response?: { data?: { message?: string } } })
								?.response?.data?.message ||
								"Failed to load mentors"}
						</div>
					) : filteredMentors.length === 0 ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-500">
							No mentors found.
						</div>
					) : (
						filteredMentors.map((mentor) => (
							<div
								key={mentor._id}
								className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="text-sm font-bold text-gray-900 truncate">
											{mentor.fullName || "-"}
										</p>
										<p className="text-xs text-gray-600 truncate">
											{mentor.email || "-"} • {mentor.phoneNumber || "-"}
										</p>
									</div>
									<Badge
										className={cn(
											"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
											statusBadgeClass(mentor.status)
										)}
									>
										{mentor.status || "-"}
									</Badge>
								</div>

								<div className="mt-3 grid grid-cols-2 gap-3">
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Country
										</p>
										<p className="text-xs font-semibold text-gray-700">
											{mentor.country || "-"}
										</p>
									</div>
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Job Type
										</p>
										<p className="text-xs font-semibold text-gray-700">
											{mentor.jobType || "-"}
										</p>
									</div>
								</div>

								<div className="mt-3 flex items-center justify-between">
									<p className="text-xs text-gray-500">
										Approved: {formatDate(mentor.approvedAt)}
									</p>
									<div className="flex items-center gap-2">
										{normalizeStatus(mentor.status) === "PENDING" && (
											<>
												<Button
													className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 h-9 w-9 p-0 rounded-lg"
													onClick={() => openConfirm("approve", mentor._id)}
												>
													<Check size={18} />
												</Button>
												<Button
													className="bg-red-50 text-red-600 hover:bg-red-100 h-9 w-9 p-0 rounded-lg"
													onClick={() => openConfirm("reject", mentor._id)}
												>
													<X size={18} />
												</Button>
											</>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</div>

				<div className="hidden md:block rounded-2xl border border-gray-100 overflow-hidden">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-[#D6E6F2]">
								<TableRow className="border-none hover:bg-transparent">
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Mentor Info
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Approval Date
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Status
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider text-center">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-32 text-center"
										>
											<Loader2 className="animate-spin inline mr-2" />
											Loading mentors...
										</TableCell>
									</TableRow>
								) : isError ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-32 text-center text-red-600"
										>
											{(error as { response?: { data?: { message?: string } } })
												?.response?.data?.message ||
												"Failed to load mentors"}
										</TableCell>
									</TableRow>
								) : filteredMentors.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="h-32 text-center">
											No mentors found.
										</TableCell>
									</TableRow>
								) : (
									filteredMentors.map((mentor) => (
										<TableRow
											key={mentor._id}
											className="hover:bg-slate-50/50 border-slate-50"
										>
											<TableCell className="py-5 px-6">
												<div className="flex flex-col space-y-1">
													<span className="text-sm font-bold text-slate-900">
														{mentor.fullName || "-"}
													</span>
													<span className="text-xs text-slate-500 font-medium">
														{mentor.email || "-"} • {mentor.phoneNumber || "-"}
													</span>
													<div className="flex items-center gap-3 mt-1 flex-wrap">
														<span className="flex items-center text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
															<Globe className="h-3 w-3 mr-1" />
															{mentor.country || "-"} ({mentor.gender || "-"})
														</span>
														<span className="flex items-center text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
															<DollarSign className="h-3 w-3 mr-1" />
															{formatCompactNumber(mentor.netWorth)}
														</span>
														<span className="flex items-center text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
															<Briefcase className="h-3 w-3 mr-1" />
															{mentor.jobType || "-"}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell className="text-xs font-medium text-slate-500 px-6">
												{formatDate(mentor.approvedAt)}
											</TableCell>
											<TableCell className="px-6">
												<Badge
													className={cn(
														"rounded-md border-none px-3 py-1 text-[10px] font-bold shadow-none",
														statusBadgeClass(mentor.status)
													)}
												>
													{mentor.status || "-"}
												</Badge>
											</TableCell>
											<TableCell className="px-6">
												<div className="flex justify-center gap-2">
													{normalizeStatus(mentor.status) === "PENDING" && (
														<>
															<Button
																onClick={() =>
																	openConfirm("approve", mentor._id)
																}
																className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 h-9 w-9 p-0 rounded-lg"
															>
																<Check size={18} />
															</Button>
															<Button
																onClick={() =>
																	openConfirm("reject", mentor._id)
																}
																className="bg-red-50 text-red-600 hover:bg-red-100 h-9 w-9 p-0 rounded-lg"
															>
																<X size={18} />
															</Button>
														</>
													)}
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</AdminCard>

			<Sheet open={detailsOpen} onOpenChange={handleDetailsOpenChange}>
				<SheetContent
					side="right"
					className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
				>
					<div className="flex h-full min-h-0 flex-col">
						<SheetHeader className="space-y-2 border-b border-slate-200/80 px-6 pb-5 pt-6 text-left">
							<SheetTitle className="text-xl font-bold text-slate-900">
								{viewingMentor?.fullName || "Mentor details"}
							</SheetTitle>
							{viewingMentor ? (
								<>
									<SheetDescription className="text-sm text-slate-500">
										{viewingMentor.email || "-"}
									</SheetDescription>
									<Badge
										className={cn(
											"mt-1 w-fit rounded-md border-none px-3 py-1 text-[10px] font-bold shadow-none",
											statusBadgeClass(viewingMentor.status)
										)}
									>
										{viewingMentor.status || "-"}
									</Badge>
								</>
							) : null}
						</SheetHeader>

						{viewingMentor ? (
							<>
							<div className="flex-1 overflow-y-auto px-6 py-5">
								<div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-1">
									<SheetDetailRow label="Phone">
										{viewingMentor.phoneNumber || "-"}
									</SheetDetailRow>
									{hasText(viewingMentor.gender) && (
										<SheetDetailRow label="Gender">
											{viewingMentor.gender!.trim()}
										</SheetDetailRow>
									)}
									{hasText(viewingMentor.country) && (
										<SheetDetailRow label="Country">
											{viewingMentor.country!.trim()}
										</SheetDetailRow>
									)}
									{hasText(viewingMentor.jobType) && (
										<SheetDetailRow label="Job Type">
											{viewingMentor.jobType!.trim()}
										</SheetDetailRow>
									)}
									<SheetDetailRow label="Net Worth">
										{formatNetWorth(viewingMentor.netWorth)}
									</SheetDetailRow>
									<SheetDetailRow label="Consent Status">
										<Badge
											className={cn(
												"rounded-md border-none px-2.5 py-0.5 text-[10px] font-bold shadow-none",
												hasConsent(viewingMentor)
													? "bg-[#E6F4EA] text-[#1E8E3E]"
													: "bg-[#FDECEC] text-[#B91C1C]"
											)}
										>
											{hasConsent(viewingMentor)
												? "Consented"
												: "No Consent"}
										</Badge>
									</SheetDetailRow>
								</div>
							</div>

							{(sheetActionVisibility.showApprove ||
								sheetActionVisibility.showReject) && (
								<SheetFooter className="mt-0 flex-row gap-3 border-t border-slate-200/80 px-6 pb-8 pt-5">
									{sheetActionVisibility.showApprove && (
										<Button
											className="h-11 flex-1 bg-emerald-600 hover:bg-emerald-700"
											disabled={isMutating}
											onClick={() =>
												openConfirm("approve", viewingMentor._id)
											}
										>
											<Check className="mr-2 h-4 w-4" />
											Approve
										</Button>
									)}
									{sheetActionVisibility.showReject && (
										<Button
											variant="destructive"
											className="h-11 flex-1"
											disabled={isMutating}
											onClick={() =>
												openConfirm("reject", viewingMentor._id)
											}
										>
											<X className="mr-2 h-4 w-4" />
											Reject
										</Button>
									)}
								</SheetFooter>
							)}
							</>
						) : null}
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
