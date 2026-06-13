"use client";

import * as React from "react";
import {
	Briefcase,
	Check,
	DollarSign,
	Eye,
	Globe,
	Loader2,
	MoreHorizontal,
	Search,
	X,
} from "lucide-react";

import api from "@/lib/api";
import { MentorProfileType } from "@/lib/api/mentor-profile";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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

function hasConsent(mentor: MentorProfileType) {
	if (typeof mentor.consent === "boolean") return mentor.consent;
	return Boolean(mentor.consentForm?.trim());
}

function formatNetWorth(value?: string) {
	const formatted = formatCompactNumber(value);
	return formatted === "-" ? "-" : `$${formatted}`;
}

function getActionVisibility(status?: string) {
	const normalized = normalizeStatus(status);
	return {
		showApprove: normalized === "PENDING" || normalized === "REJECTED",
		showReject: normalized === "PENDING" || normalized === "APPROVED",
	};
}

function hasText(value?: string | null) {
	return Boolean(value?.trim());
}

function MentorMetadataPills({ mentor }: { mentor: MentorProfileType }) {
	const netWorth = formatCompactNumber(mentor.netWorth);
	const showNetWorth = netWorth !== "-";
	const showJobType = hasText(mentor.jobType);

	if (!hasText(mentor.country) && !showNetWorth && !showJobType) return null;

	return (
		<div className="flex items-center gap-2 mt-1 flex-wrap">
			{hasText(mentor.country) && (
				<span className="inline-flex items-center gap-1 text-xs text-slate-500">
					<Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
					{mentor.country!.trim()}
				</span>
			)}
			{showNetWorth && (
				<span className="inline-flex items-center gap-1 text-xs text-slate-500">
					<DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
					{netWorth}
				</span>
			)}
			{showJobType && (
				<span className="inline-flex items-center gap-1 text-xs text-slate-500">
					<Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
					{mentor.jobType!.trim()}
				</span>
			)}
		</div>
	);
}

function MentorActionsMenu({
	mentor,
	onViewDetails,
	onApprove,
	onReject,
}: {
	mentor: MentorProfileType;
	onViewDetails: (mentor: MentorProfileType) => void;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
}) {
	const { showApprove, showReject } = getActionVisibility(mentor.status);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9 rounded-lg border border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200/80 hover:text-slate-700"
				>
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Open actions</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44 rounded-xl">
				<DropdownMenuItem onClick={() => onViewDetails(mentor)}>
					<Eye className="mr-2 h-4 w-4" />
					View Details
				</DropdownMenuItem>
				{(showApprove || showReject) && <DropdownMenuSeparator />}
				{showApprove && (
					<DropdownMenuItem onClick={() => onApprove(mentor._id)}>
						<Check className="mr-2 h-4 w-4 text-emerald-600" />
						Approve
					</DropdownMenuItem>
				)}
				{showReject && (
					<DropdownMenuItem onClick={() => onReject(mentor._id)}>
						<X className="mr-2 h-4 w-4 text-red-600" />
						Reject
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SheetDetailRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-start justify-between gap-6 border-b border-slate-100 py-3.5 last:border-b-0">
			<span className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
				{label}
			</span>
			<div className="min-w-0 text-right text-sm font-medium text-slate-900">
				{children}
			</div>
		</div>
	);
}

export default function MentorProfilePage() {
	const [search, setSearch] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [selectedId, setSelectedId] = React.useState<string | null>(null);
	const [actionType, setActionType] =
		React.useState<ConfirmAction>("approve");
	const [detailsOpen, setDetailsOpen] = React.useState(false);
	const [viewingMentor, setViewingMentor] =
		React.useState<MentorProfileType | null>(null);

	const {
		data: mentors = [],
		isLoading,
		isError,
		error,
	} = api.MentorProfile.GetList.useQuery();

	const { mutate: approve, isPending: isApproving } =
		api.MentorProfile.Approve.useMutation();
	const { mutate: reject, isPending: isRejecting } =
		api.MentorProfile.Reject.useMutation();

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

	React.useEffect(() => {
		if (!viewingMentor) return;
		const updated = (mentors as MentorProfileType[]).find(
			(m) => m._id === viewingMentor._id
		);
		if (updated) setViewingMentor(updated);
	}, [mentors, viewingMentor?._id]);

	const openDetails = (mentor: MentorProfileType) => {
		setViewingMentor(mentor);
		setDetailsOpen(true);
	};

	const handleDetailsOpenChange = (open: boolean) => {
		setDetailsOpen(open);
		if (!open) setViewingMentor(null);
	};

	const openConfirm = (action: ConfirmAction, id: string) => {
		setActionType(action);
		setSelectedId(id);
		setConfirmOpen(true);
	};

	const handleAction = () => {
		if (!selectedId) return;
		const mutationOptions = {
			onSuccess: () => setConfirmOpen(false),
		};
		if (actionType === "approve") approve(selectedId, mutationOptions);
		else reject(selectedId, mutationOptions);
	};

	const sheetActionVisibility = getActionVisibility(viewingMentor?.status);

	const inputSurfaceClass =
		"bg-slate-50 border border-slate-200/80 h-12 rounded-lg text-sm";

	return (
		<div className="space-y-6">
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

			<PageHeader
				title="Mentor"
				description="Manage and verify mentor profiles"
			/>

			<AdminCard className="p-4 sm:p-6 md:p-8">
				<div className="mb-8 flex flex-col justify-between gap-4 md:flex-row">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder="Search mentor name"
							className={cn("pl-11", inputSurfaceClass)}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<FilterField label="Filter Status">
						<Select
							value={statusFilter}
							onValueChange={(value) =>
								setStatusFilter(value as StatusFilter)
							}
						>
							<SelectTrigger
								className={cn(
									"w-full sm:w-40 md:w-35 text-xs font-semibold",
									inputSurfaceClass
								)}
							>
								<SelectValue placeholder="All Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All</SelectItem>
								<SelectItem value="PENDING">Pending</SelectItem>
								<SelectItem value="APPROVED">Approved</SelectItem>
								<SelectItem value="REJECTED">Rejected</SelectItem>
							</SelectContent>
						</Select>
					</FilterField>
				</div>

				<div className="border-t border-slate-200/80 md:hidden">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center text-sm text-slate-600">
							<Loader2 className="animate-spin mr-2" /> Loading mentors...
						</div>
					) : isError ? (
						<div className="flex h-40 items-center justify-center px-2 text-center text-sm text-red-600">
							{(error as { response?: { data?: { message?: string } } })
								?.response?.data?.message ||
								"Failed to load mentors"}
						</div>
					) : filteredMentors.length === 0 ? (
						<div className="flex h-40 items-center justify-center text-sm text-slate-500">
							No mentors found.
						</div>
					) : (
						filteredMentors.map((mentor) => (
							<div
								key={mentor._id}
								className="border-b border-slate-100 p-4 last:border-b-0"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate text-sm font-semibold text-slate-900">
											{mentor.fullName || "-"}
										</p>
										<p className="truncate text-xs text-slate-600">
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

								{(hasText(mentor.country) || hasText(mentor.jobType)) && (
									<div
										className={cn(
											"mt-3 grid gap-3",
											hasText(mentor.country) && hasText(mentor.jobType)
												? "grid-cols-2"
												: "grid-cols-1"
										)}
									>
										{hasText(mentor.country) && (
											<div className="rounded-xl bg-slate-50 px-3 py-2">
												<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
													Country
												</p>
												<p className="text-xs font-semibold text-slate-700">
													{mentor.country!.trim()}
												</p>
											</div>
										)}
										{hasText(mentor.jobType) && (
											<div className="rounded-xl bg-slate-50 px-3 py-2">
												<p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
													Job Type
												</p>
												<p className="text-xs font-semibold text-slate-700">
													{mentor.jobType!.trim()}
												</p>
											</div>
										)}
									</div>
								)}

								<div className="mt-3 flex items-center justify-between">
									<p className="text-xs text-slate-500">
										Approved: {formatDate(mentor.approvedAt)}
									</p>
									<MentorActionsMenu
										mentor={mentor}
										onViewDetails={openDetails}
										onApprove={(id) => openConfirm("approve", id)}
										onReject={(id) => openConfirm("reject", id)}
									/>
								</div>
							</div>
						))
					)}
				</div>

				<div className="hidden border-t border-slate-200/80 md:block">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-slate-50 border-b border-slate-200/80">
								<TableRow className="border-none hover:bg-transparent">
									<TableHead className="h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
										Mentor Info
									</TableHead>
									<TableHead className="h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
										Approval Date
									</TableHead>
									<TableHead className="h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
										Status
									</TableHead>
									<TableHead className="h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
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
													<MentorMetadataPills mentor={mentor} />
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
												<div className="flex justify-center">
													<MentorActionsMenu
														mentor={mentor}
														onViewDetails={openDetails}
														onApprove={(id) => openConfirm("approve", id)}
														onReject={(id) => openConfirm("reject", id)}
													/>
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
