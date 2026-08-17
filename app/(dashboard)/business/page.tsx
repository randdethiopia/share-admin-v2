"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, Loader2, MoreHorizontal, Search, X } from "lucide-react";

import api from "@/lib/api";
import type { BusinessProfileListParams, BusinessProfileType } from "@/lib/api";
import {
	formatPendingUpdatesCount,
	useAdminPendingUpdatesCount,
} from "@/lib/api";
import { AdminCard } from "@/components/shared/admin/AdminCard";
import { FilterField } from "@/components/shared/admin/FilterField";
import { PageHeader } from "@/components/shared/admin/PageHeader";
import { StatusBadge } from "@/components/shared/admin/StatusBadge";
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
	buildUrlWithFilter,
	parseFilterParam,
	parseStatusParam,
	PENDING_UPDATES_FILTER,
	STATUS_URL_PARAM,
	FILTER_URL_PARAM,
	useCorrectPaginationPage,
	useUrlPagination,
} from "@/hooks/use-url-pagination";
import { getPaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
const BUSINESS_STATUS_VALUES = [
	"PENDING",
	"APPROVED",
	"REJECTED",
	"DRAFT",
] as const satisfies readonly StatusFilter[];
type ConfirmAction =
	| "approve"
	| "reject"
	| "update-approve"
	| "update-reject";

const inputSurfaceClass =
	"bg-slate-50 border border-slate-200/80 h-12 rounded-lg text-sm";

const tableHeadClass =
	"h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500";

const businessTableCol = {
	name: "w-[40%]",
	approvedAt: "w-[20%]",
	status: "w-[20%]",
	actions: "w-[20%]",
} as const;

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function formatDate(value?: string) {
	if (!value) return "-";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleDateString();
}

function getBusinessOwnerName(business: BusinessProfileType) {
	const ownerName = business.name?.trim();
	if (ownerName) return ownerName;

	const firstName = business.smeId?.firstName?.trim() ?? "";
	const lastName = business.smeId?.lastName?.trim() ?? "";
	return `${firstName} ${lastName}`.trim() || "-";
}

function getBusinessApprovalDisplay(business: BusinessProfileType) {
	if (normalizeStatus(business.status) !== "APPROVED" || !business.approvedAt) {
		return "-";
	}
	return formatDate(business.approvedAt);
}

function BusinessNameCell({ business }: { business: BusinessProfileType }) {
	return (
		<div className="flex min-w-0 flex-col space-y-1">
			<span className="truncate text-sm font-bold text-slate-900">
				{getBusinessOwnerName(business)}
			</span>
			<span className="truncate text-xs font-medium text-slate-500">
				{business.email?.trim() || "-"}
			</span>
			<span className="truncate text-xs font-medium text-slate-500">
				{business.businessName?.trim() || "-"}
			</span>
		</div>
	);
}

function getBusinessActionVisibility(status?: string) {
	const normalized = normalizeStatus(status);
	return {
		showApprove: normalized === "PENDING" || normalized === "REJECTED",
		showReject: normalized === "PENDING" || normalized === "APPROVED",
	};
}

function isUpdateRequestPending(updateStatus?: string) {
	// "REQUEST_UPDATE" is not a value the backend ever writes — the legacy flow
	// only ever sets PENDING, APPROVED or NOT_ALLOWED.
	return normalizeStatus(updateStatus) === "PENDING";
}

const BUSINESS_LIST_PATH = "/business";

function BusinessActionsMenu({
	business,
	page,
	pageSize,
	onApprove,
	onReject,
	onUpdateApprove,
	onUpdateReject,
	disabled,
}: {
	business: BusinessProfileType;
	page: number;
	pageSize: number;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
	onUpdateApprove: (id: string) => void;
	onUpdateReject: (id: string) => void;
	disabled?: boolean;
}) {
	const { showApprove, showReject } = getBusinessActionVisibility(business.status);
	const showUpdateActions = isUpdateRequestPending(business.updateStatus);
	const hasBusinessActions = showApprove || showReject;
	const hasActionItems = hasBusinessActions || showUpdateActions;

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
			<DropdownMenuContent align="end" className="w-52 rounded-xl">
				<DropdownMenuItem asChild>
					<Link
						href={buildDetailHref(
							BUSINESS_LIST_PATH,
							business._id,
							page,
							pageSize
						)}
						className="flex cursor-pointer items-center"
					>
						<Eye className="mr-2 h-4 w-4" />
						View Details
					</Link>
				</DropdownMenuItem>

				{hasActionItems && <DropdownMenuSeparator />}

				{showApprove && (
					<DropdownMenuItem onClick={() => onApprove(business._id)}>
						<Check className="mr-2 h-4 w-4 text-emerald-600" />
						Approve Business
					</DropdownMenuItem>
				)}
				{showReject && (
					<DropdownMenuItem onClick={() => onReject(business._id)}>
						<X className="mr-2 h-4 w-4 text-red-600" />
						Reject Business
					</DropdownMenuItem>
				)}

				{showUpdateActions && hasBusinessActions && <DropdownMenuSeparator />}

				{showUpdateActions && (
					<DropdownMenuItem onClick={() => onUpdateApprove(business._id)}>
						<Check className="mr-2 h-4 w-4 text-emerald-600" />
						Approve Profile Update
					</DropdownMenuItem>
				)}
				{showUpdateActions && (
					<DropdownMenuItem onClick={() => onUpdateReject(business._id)}>
						<X className="mr-2 h-4 w-4 text-red-600" />
						Reject Profile Update
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function BusinessPageInner() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const statusFromUrl = React.useMemo(
		() =>
			parseStatusParam(
				searchParams.get(STATUS_URL_PARAM),
				BUSINESS_STATUS_VALUES
			) as StatusFilter,
		[searchParams]
	);

	const filterFromUrl = React.useMemo(
		() => parseFilterParam(searchParams.get(FILTER_URL_PARAM)),
		[searchParams]
	);
	const isPendingUpdatesFilter = filterFromUrl === PENDING_UPDATES_FILTER;

	const [search, setSearch] = React.useState("");
	const [status, setStatus] = React.useState<StatusFilter>(statusFromUrl);
	const { page, pageSize, setPage, setPageSize, resetPagination } =
		useUrlPagination();
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [confirmAction, setConfirmAction] =
		React.useState<ConfirmAction>("approve");
	const [selectedId, setSelectedId] = React.useState<string | null>(null);

	const listParams = React.useMemo(
		(): BusinessProfileListParams => ({
			...(status !== "all" && !isPendingUpdatesFilter ? { status } : {}),
			...(filterFromUrl ? { filter: filterFromUrl } : {}),
			...(search.trim() ? { search: search.trim() } : {}),
		}),
		[status, isPendingUpdatesFilter, filterFromUrl, search]
	);

	const {
		data: listData,
		isLoading,
		isError,
		error,
	} = api.BusinessProfile.GetList.useQuery(listParams);

	const businesses = React.useMemo(
		() => listData?.profiles ?? [],
		[listData?.profiles]
	);
	const totalItems = businesses.length;

	const { mutate: approveBusiness, isPending: isApproving } =
		api.BusinessProfile.Approve.useMutation();
	const { mutate: rejectBusiness, isPending: isRejecting } =
		api.BusinessProfile.Reject.useMutation();
	const { mutate: approveUpdate, isPending: isApprovingUpdate } =
		api.BusinessProfile.UpdateApprove.useMutation();
	const { mutate: rejectUpdate, isPending: isRejectingUpdate } =
		api.BusinessProfile.UpdateReject.useMutation();

	const { data: pendingUpdatesCountData } = useAdminPendingUpdatesCount();
	const pendingUpdatesCount = pendingUpdatesCountData?.count ?? 0;

	React.useEffect(() => {
		setStatus(statusFromUrl);
	}, [statusFromUrl]);

	const setStatusFilter = React.useCallback(
		(value: StatusFilter) => {
			setStatus(value);
			const params = new URLSearchParams(searchParams.toString());
			if (value !== "all") {
				params.set(STATUS_URL_PARAM, value);
			} else {
				params.delete(STATUS_URL_PARAM);
			}
			params.delete(FILTER_URL_PARAM);
			params.delete("page");
			const qs = params.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[pathname, router, searchParams]
	);

	const setPendingUpdatesFilter = React.useCallback(
		(active: boolean) => {
			if (active) {
				setStatus("all");
			}
			router.replace(
				buildUrlWithFilter(
					pathname,
					searchParams,
					active ? PENDING_UPDATES_FILTER : null
				),
				{ scroll: false }
			);
		},
		[pathname, router, searchParams]
	);

	const pagination = React.useMemo(
		() => getPaginationMeta(totalItems, page, pageSize),
		[totalItems, page, pageSize]
	);

	useCorrectPaginationPage({
		isLoading,
		totalItems,
		page,
		safePage: pagination.safePage,
		setPage,
	});

	const paginatedRows = React.useMemo(
		() =>
			businesses.slice(pagination.startIndex, pagination.endIndexExclusive),
		[businesses, pagination.startIndex, pagination.endIndexExclusive]
	);

	const openConfirm = (action: ConfirmAction, id: string) => {
		setConfirmAction(action);
		setSelectedId(id);
		setConfirmOpen(true);
	};

	const submitConfirm = () => {
		if (!selectedId) return;
		const mutationOptions = {
			onSuccess: () => setConfirmOpen(false),
		};
		if (confirmAction === "approve") approveBusiness(selectedId, mutationOptions);
		else if (confirmAction === "reject")
			rejectBusiness({ id: selectedId }, mutationOptions);
		else if (confirmAction === "update-approve")
			approveUpdate(selectedId, mutationOptions);
		else rejectUpdate({ id: selectedId }, mutationOptions);
	};

	const isMutating =
		isApproving || isRejecting || isApprovingUpdate || isRejectingUpdate;

	const renderActionsMenu = (business: BusinessProfileType) => (
		<BusinessActionsMenu
			business={business}
			page={page}
			pageSize={pageSize}
			onApprove={(id) => openConfirm("approve", id)}
			onReject={(id) => openConfirm("reject", id)}
			onUpdateApprove={(id) => openConfirm("update-approve", id)}
			onUpdateReject={(id) => openConfirm("update-reject", id)}
			disabled={isMutating}
		/>
	);

	return (
		<div className="space-y-6">
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

			<PageHeader
				category="Business"
				title="Business"
				description="See all your businesses"
				className="px-4"
			/>

			<AdminCard className="min-h-[70vh] p-4 sm:p-6 md:p-8">
				<div className="mb-8 flex flex-col justify-between gap-4 md:flex-row">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
							disabled={isPendingUpdatesFilter}
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

				<div className="mb-6 flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => setPendingUpdatesFilter(false)}
						className={cn(
							"rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
							!isPendingUpdatesFilter
								? "border-slate-200 bg-white text-slate-700 shadow-xs"
								: "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80"
						)}
					>
						All
					</button>
					<button
						type="button"
						onClick={() => setPendingUpdatesFilter(true)}
						className={cn(
							"inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
							isPendingUpdatesFilter
								? "border-[#69B34C]/30 bg-[#69B34C]/10 text-[#3B6A22] shadow-xs"
								: "border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80"
						)}
					>
						Pending Updates
						<span
							className={cn(
								"flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
								isPendingUpdatesFilter
									? "bg-[#FF4E11]/10 text-[#FF4E11]"
									: "bg-slate-200 text-slate-700"
							)}
						>
							{formatPendingUpdatesCount(pendingUpdatesCount)}
						</span>
					</button>
				</div>

				<div className="border-t border-slate-200/80 md:hidden">
					{isLoading ? (
						<div className="flex h-40 items-center justify-center text-sm text-slate-600">
							<Loader2 className="mr-2 animate-spin" /> Loading...
						</div>
					) : isError ? (
						<div className="flex h-40 items-center justify-center px-2 text-center text-sm text-red-600">
							{(error as { response?: { data?: { message?: string } } })
								?.response?.data?.message || "Failed to load businesses"}
						</div>
					) : totalItems === 0 ? (
						<div className="flex h-40 items-center justify-center text-sm text-slate-500">
							No businesses found.
						</div>
					) : (
						paginatedRows.map((business) => (
							<div
								key={business._id}
								className="border-b border-slate-100 p-4 last:border-b-0"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<BusinessNameCell business={business} />
										<p className="mt-2 text-xs text-slate-500">
											Approved at: {getBusinessApprovalDisplay(business)}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-2">
										<StatusBadge status={business.status} />
										{renderActionsMenu(business)}
									</div>
								</div>

							</div>
						))
					)}
				</div>

				<div className="hidden border-t border-slate-200/80 md:block">
					<div className="overflow-x-auto">
						<Table className="table-fixed">
							<TableHeader className="bg-slate-50 border-b border-slate-200/80">
								<TableRow className="border-none hover:bg-transparent">
									<TableHead className={cn(tableHeadClass, businessTableCol.name)}>
										Name
									</TableHead>
									<TableHead
										className={cn(tableHeadClass, businessTableCol.approvedAt)}
									>
										Approved at
									</TableHead>
									<TableHead className={cn(tableHeadClass, businessTableCol.status)}>
										Status
									</TableHead>
									<TableHead
										className={cn(
											tableHeadClass,
											businessTableCol.actions,
											"text-center"
										)}
									>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={4} className="h-40 text-center">
											<Loader2 className="mr-2 inline animate-spin" /> Loading...
										</TableCell>
									</TableRow>
								) : isError ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-40 text-center text-sm text-red-600"
										>
											{(error as { response?: { data?: { message?: string } } })
												?.response?.data?.message ||
												"Failed to load businesses"}
										</TableCell>
									</TableRow>
								) : totalItems === 0 ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="h-40 text-center text-sm text-slate-500"
										>
											No businesses found.
										</TableCell>
									</TableRow>
								) : (
									paginatedRows.map((business) => (
										<TableRow
											key={business._id}
											className="border-slate-50 hover:bg-slate-50/50"
										>
											<TableCell
												className={cn(
													"whitespace-normal px-6 py-4",
													businessTableCol.name
												)}
											>
												<BusinessNameCell business={business} />
											</TableCell>
											<TableCell
												className={cn(
													"whitespace-nowrap px-6 py-4 text-xs font-medium text-slate-500",
													businessTableCol.approvedAt
												)}
											>
												{getBusinessApprovalDisplay(business)}
											</TableCell>
											<TableCell
												className={cn("px-6 py-4", businessTableCol.status)}
											>
												<StatusBadge status={business.status} />
											</TableCell>
											<TableCell
												className={cn("px-6 py-4", businessTableCol.actions)}
											>
												<div className="flex justify-center">
													{renderActionsMenu(business)}
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</div>

				<div className="mt-6 flex flex-col gap-4 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold text-slate-500">
							Items per page
						</span>
						<Select
							value={String(pageSize)}
							onValueChange={(value) => {
								setPageSize(Number(value));
							}}
						>
							<SelectTrigger className="h-10 w-24 rounded-lg border border-slate-200/80 bg-slate-50 text-xs font-semibold">
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
						totalItems={totalItems}
						pageSize={pageSize}
						disabled={isLoading || isError}
					/>
				</div>
			</AdminCard>
		</div>
	);
}

export default function BusinessPage() {
	return (
		<React.Suspense
			fallback={
				<div className="flex h-[60vh] items-center justify-center">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<BusinessPageInner />
		</React.Suspense>
	);
}
