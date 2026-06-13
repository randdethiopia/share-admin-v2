"use client";

import * as React from "react";
import Link from "next/link";
import {
	Eye,
	Key,
	Loader2,
	MoreHorizontal,
	Plus,
	Search,
	UserCheck,
	UserX,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import type { ProfileType } from "@/lib/api/admin-profile";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import PaginationControls from "@/components/shared/PaginationControls";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import AssignRoleModal from "../../admin/components/assign-role";

function formatDate(value?: string) {
	if (!value) return "-";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "-";
	return parsed.toLocaleDateString();
}

function statusBadgeClass(status?: ProfileType["status"]) {
	switch (status) {
		case "ACTIVE":
			return "bg-[#E6F4EA] text-[#1E8E3E]";
		case "TERMINATED":
			return "bg-[#FDECEC] text-[#B91C1C]";
		default:
			return "bg-slate-100 text-slate-600";
	}
}

function getAdminDisplayName(admin: ProfileType) {
	return `${admin.firstName} ${admin.lastName}`.trim() || "-";
}

function getStatusLabel(status?: ProfileType["status"]) {
	return status === "TERMINATED"
		? "Deactivated"
		: status === "ACTIVE"
			? "Active"
			: (status ?? "-");
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

const tableHeadClass =
	"h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-8";

function AdminActionsMenu({
	admin,
	isSelfAdmin,
	disabled,
	onViewDetails,
	onAssignRole,
	onActivate,
	onDeactivate,
}: {
	admin: ProfileType;
	isSelfAdmin: boolean;
	disabled?: boolean;
	onViewDetails: (admin: ProfileType) => void;
	onAssignRole: (admin: ProfileType) => void;
	onActivate: (admin: ProfileType) => void;
	onDeactivate: (admin: ProfileType) => void;
}) {
	const showActivate = admin.status === "TERMINATED";
	const showDeactivate = admin.status === "ACTIVE" && !isSelfAdmin;
	const showStatusActions = showActivate || showDeactivate;

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
				<DropdownMenuItem onClick={() => onViewDetails(admin)}>
					<Eye className="mr-2 h-4 w-4" />
					View Details
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => onAssignRole(admin)}>
					<Key className="mr-2 h-4 w-4" />
					Assign Role
				</DropdownMenuItem>
				{showStatusActions && <DropdownMenuSeparator />}
				{showActivate && (
					<DropdownMenuItem onClick={() => onActivate(admin)}>
						<UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
						Activate
					</DropdownMenuItem>
				)}
				{showDeactivate && (
					<DropdownMenuItem onClick={() => onDeactivate(admin)}>
						<UserX className="mr-2 h-4 w-4 text-red-600" />
						Deactivate
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default function AdminManagementPage() {
	const [search, setSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [detailsOpen, setDetailsOpen] = React.useState(false);
	const [viewingAdmin, setViewingAdmin] = React.useState<ProfileType | null>(null);
	const [assignTarget, setAssignTarget] = React.useState<{
		id: string;
		name: string;
		phoneNumber: string;
		roles?: { _id: string; name: string }[];
	} | null>(null);
	const [pendingAction, setPendingAction] = React.useState<{
		type: "activate" | "deactivate";
		id: string;
		name: string;
	} | null>(null);
	const pageSize = DEFAULT_PAGE_SIZE;
	const queryClient = useQueryClient();
	const { data: admins = [], isLoading } = api.AdminProfile.GetList.useQuery();
	const { mutate: activate, isPending: isActivating } =
		api.AdminProfile.Activate.useMutation();
	const { mutate: deactivate, isPending: isDeactivating } =
		api.AdminProfile.Deactivate.useMutation();

	const loggedInUserId = useAuthStore((s) => s._id);
	const hasHydrated = useAuthStore((s) => s.hasHydrated);

	const isSelf = (admin: ProfileType) =>
		hasHydrated && Boolean(loggedInUserId && admin._id === loggedInUserId);

	const filteredAdmins = React.useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return admins;
		return admins.filter((admin: ProfileType) => {
			const fullName = `${admin.firstName} ${admin.lastName}`.toLowerCase();
			return (
				fullName.includes(term) || admin.email.toLowerCase().includes(term)
			);
		});
	}, [admins, search]);

	const paginationMeta = React.useMemo(
		() => getPaginationMeta(filteredAdmins.length, page, pageSize),
		[filteredAdmins.length, page, pageSize]
	);

	const pagedAdmins = React.useMemo(
		() =>
			filteredAdmins.slice(
				paginationMeta.startIndex,
				paginationMeta.endIndexExclusive
			),
		[filteredAdmins, paginationMeta.endIndexExclusive, paginationMeta.startIndex]
	);

	const isWorking = isActivating || isDeactivating;

	const viewingAdminId = viewingAdmin?._id;

	React.useEffect(() => {
		if (!viewingAdminId) return;
		const updated = admins.find((a) => a._id === viewingAdminId);
		if (updated) setViewingAdmin(updated);
	}, [admins, viewingAdminId]);

	const openDetails = (admin: ProfileType) => {
		setViewingAdmin(admin);
		setDetailsOpen(true);
	};

	const handleDetailsOpenChange = (open: boolean) => {
		setDetailsOpen(open);
		if (!open) setViewingAdmin(null);
	};

	const openConfirm = (
		type: "activate" | "deactivate",
		admin: ProfileType
	) => {
		if (type === "deactivate" && isSelf(admin)) return;

		setPendingAction({
			type,
			id: admin._id,
			name: `${admin.firstName} ${admin.lastName}`.trim(),
		});
		setDialogOpen(true);
	};

	const openAssignRole = (admin: ProfileType) => {
		setAssignTarget({
			id: admin._id,
			name: `${admin.firstName} ${admin.lastName}`.trim(),
			phoneNumber: admin.phoneNumber,
			roles: admin.roles,
		});
	};

	const handleConfirm = () => {
		if (!pendingAction) return;
		if (
			pendingAction.type === "deactivate" &&
			loggedInUserId &&
			pendingAction.id === loggedInUserId
		) {
			return;
		}
		const nextStatus =
			pendingAction.type === "activate" ? "ACTIVE" : "TERMINATED";

		queryClient.setQueryData<ProfileType[]>(["AdminProfile"], (old) =>
			(old ?? []).map((item) =>
				item._id === pendingAction.id ? { ...item, status: nextStatus } : item
			)
		);

		if (pendingAction.type === "activate") {
			activate(pendingAction.id, {
				onError: () =>
					queryClient.invalidateQueries({ queryKey: ["AdminProfile"] }),
			});
		} else {
			deactivate(pendingAction.id, {
				onError: () =>
					queryClient.invalidateQueries({ queryKey: ["AdminProfile"] }),
			});
		}
		setDialogOpen(false);
		setPendingAction(null);
	};

	return (
		<div className="space-y-6">
			{/* HEADER */}
			<div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-[28px] font-bold text-black tracking-tight">
						Admin
					</h1>
					<p className="text-zinc-500 font-medium">See all your Admin</p>
				</div>
				<Button
					asChild
					className="h-11 rounded-xl bg-[#3B82F6] px-6 font-bold text-white shadow-md hover:bg-blue-600"
				>
					<Link href="/admin-dashboard/admin/new">
						<Plus className="mr-1 h-5 w-5" /> New Admin
					</Link>
				</Button>
			</div>

			{/* MASTER CONTAINER */}
			<div className="rounded-3xl border border-slate-200/60 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
				{/* TOP BAR */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-sm">
						<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder="Search name or email..."
							className="h-11 rounded-lg border border-slate-200/80 bg-slate-50 pl-11 text-sm placeholder:text-slate-400"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					<div className="text-xs font-bold text-slate-400">
						Total: {filteredAdmins.length} Admins
					</div>
				</div>

				{/* TABLE */}
				<div className="overflow-x-auto rounded-2xl border border-gray-100">
					<Table className="min-w-180">
						<TableHeader className="bg-slate-50 border-b border-slate-200/80">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className={cn(tableHeadClass, "w-[45%]")}>
									Name
								</TableHead>
								<TableHead className={cn(tableHeadClass, "w-[25%]")}>
									Status
								</TableHead>
								<TableHead
									className={cn(tableHeadClass, "w-[30%] text-right")}
								>
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="h-40 text-center text-slate-500"
									>
										<Loader2 className="mr-2 inline animate-spin" /> Loading...
									</TableCell>
								</TableRow>
							) : filteredAdmins.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="h-40 text-center text-sm text-slate-500"
									>
										No admins found.
									</TableCell>
								</TableRow>
							) : (
								pagedAdmins.map((admin: ProfileType) => (
									<TableRow
										key={admin._id}
										className="border-gray-50 hover:bg-slate-50/50"
									>
										<TableCell className="px-6 py-5 font-bold text-slate-900 sm:px-8">
											{admin.firstName} {admin.lastName}
										</TableCell>
										<TableCell className="px-6 py-5 sm:px-8">
											<Badge
												className={cn(
													"rounded-md border-none px-3 py-1 text-[10px] font-bold shadow-none",
													statusBadgeClass(admin.status)
												)}
											>
												{getStatusLabel(admin.status)}
											</Badge>
										</TableCell>
										<TableCell className="px-6 py-5 sm:px-8">
											<div className="flex justify-end">
												<AdminActionsMenu
													admin={admin}
													isSelfAdmin={isSelf(admin)}
													disabled={isWorking}
													onViewDetails={openDetails}
													onAssignRole={openAssignRole}
													onActivate={(a) => openConfirm("activate", a)}
													onDeactivate={(a) =>
														openConfirm("deactivate", a)
													}
												/>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>

				<PaginationControls
					page={paginationMeta.safePage}
					onPageChange={setPage}
					totalItems={filteredAdmins.length}
					pageSize={pageSize}
					disabled={isLoading}
				/>
			</div>

			<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{pendingAction?.type === "activate"
								? "Activate admin?"
								: "Deactivate admin?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingAction?.type === "activate"
								? `Are you sure you want to activate ${pendingAction?.name}?`
								: `Are you sure you want to deactivate ${pendingAction?.name}?`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirm}
							disabled={isWorking || !pendingAction}
							className={
								pendingAction?.type === "activate"
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-red-600 hover:bg-red-700"
							}
						>
							{isWorking
								? "Please wait..."
								: pendingAction?.type === "activate"
									? "Activate"
									: "Deactivate"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>


			<Sheet open={detailsOpen} onOpenChange={handleDetailsOpenChange}>
				<SheetContent
					side="right"
					className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
				>
					<div className="flex h-full min-h-0 flex-col">
						<SheetHeader className="space-y-2 border-b border-slate-200/80 px-6 pb-5 pt-6 text-left">
							<SheetTitle className="text-xl font-bold text-slate-900">
								{viewingAdmin
									? getAdminDisplayName(viewingAdmin)
									: "Admin details"}
							</SheetTitle>
							{viewingAdmin ? (
								<>
									<SheetDescription className="text-sm text-slate-500">
										{viewingAdmin.email || "-"}
									</SheetDescription>
									<Badge
										className={cn(
											"mt-1 w-fit rounded-md border-none px-3 py-1 text-[10px] font-bold shadow-none",
											statusBadgeClass(viewingAdmin.status)
										)}
									>
										{getStatusLabel(viewingAdmin.status)}
									</Badge>
								</>
							) : null}
						</SheetHeader>

						{viewingAdmin ? (
							<div className="flex-1 overflow-y-auto px-6 py-5">
								<div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-1">
									<SheetDetailRow label="Phone">
										{viewingAdmin.phoneNumber || "-"}
									</SheetDetailRow>
									<SheetDetailRow label="Created">
										{formatDate(viewingAdmin.createdAt)}
									</SheetDetailRow>
									<SheetDetailRow label="Approved">
										{formatDate(viewingAdmin.approvedAt)}
									</SheetDetailRow>
								</div>

								<div className="mt-5 space-y-2">
									<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
										Roles
									</p>
									{viewingAdmin.roles?.length ? (
										<div className="flex flex-wrap gap-2">
											{viewingAdmin.roles.map((role) => (
												<Badge
													key={role._id}
													variant="secondary"
													className="rounded-md px-2.5 py-0.5 text-xs font-medium"
												>
													{role.name}
												</Badge>
											))}
										</div>
									) : (
										<p className="text-sm text-slate-500">No roles assigned.</p>
									)}
								</div>
							</div>
						) : null}
					</div>
				</SheetContent>
			</Sheet>

			<AssignRoleModal
				open={!!assignTarget}
				admin={assignTarget}
				onOpenChange={(open) => {
					if (!open) setAssignTarget(null);
				}}
			/>
		</div>
	);
}
