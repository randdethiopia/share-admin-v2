"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Plus, Search, UserCheck, UserX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import api from "@/api";
import type { ProfileType } from "@/api/admin-profile";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PaginationControls from "@/components/shared/PaginationControls";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";

export default function AdminManagementPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState<{
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

	const filteredAdmins = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return admins;
		return admins.filter((admin: ProfileType) => {
			const fullName = `${admin.firstName} ${admin.lastName}`.toLowerCase();
			return (
				fullName.includes(term) || admin.email.toLowerCase().includes(term)
			);
		});
	}, [admins, search]);

	const paginationMeta = useMemo(
		() => getPaginationMeta(filteredAdmins.length, page, pageSize),
		[filteredAdmins.length, page, pageSize]
	);

	const pagedAdmins = useMemo(
		() =>
			filteredAdmins.slice(
				paginationMeta.startIndex,
				paginationMeta.endIndexExclusive
			),
		[filteredAdmins, paginationMeta.endIndexExclusive, paginationMeta.startIndex]
	);

	const isWorking = isActivating || isDeactivating;

	const openConfirm = (
		type: "activate" | "deactivate",
		admin: ProfileType
	) => {
		setPendingAction({
			type,
			id: admin._id,
			name: `${admin.firstName} ${admin.lastName}`.trim(),
		});
		setDialogOpen(true);
	};

	const handleConfirm = () => {
		if (!pendingAction) return;
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
					<Link href="/admin/new">
						<Plus className="mr-1 h-5 w-5" /> New Admin
					</Link>
				</Button>
			</div>

			{/* MASTER CONTAINER */}
			<div className="rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
				{/* TOP BAR */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-sm">
						<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Search name or email..."
							className="h-12 rounded-xl border-none bg-[#F3F8FF] pl-11 text-sm"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					<div className="text-xs font-bold text-gray-400">
						Total: {filteredAdmins.length} Admins
					</div>
				</div>

				{/* TABLE */}
				<div className="overflow-x-auto rounded-2xl border border-gray-100">
					  <Table className="min-w-180">
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Name
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Email
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Phone
								</TableHead>
								<TableHead className="h-12 px-6 text-right text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
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
							) : filteredAdmins.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="h-40 text-center text-sm text-gray-500">
										No admins found.
									</TableCell>
								</TableRow>
							) : (
								pagedAdmins.map((admin: ProfileType) => (
									<TableRow
										key={admin._id}
										className="border-gray-50 hover:bg-slate-50/50"
									>
										<TableCell className="px-6 py-5 font-bold text-gray-700 sm:px-8">
											{admin.firstName} {admin.lastName}
										</TableCell>
										<TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
											{admin.email}
										</TableCell>
										<TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
											{admin.phoneNumber}
										</TableCell>
										
                                  <TableCell className="px-6 py-5 sm:px-8">
  
                                    <div className="flex items-center justify-end gap-2">
 
                                         <Link
                                 href={`/dashboard/admin/${admin._id}`}
                               className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                           >
                                                <Eye size={16} />
                                                        </Link>
                                                <div className="flex w-24 justify-start"> 
			{admin.status === "TERMINATED" ? (
				<button
					onClick={() => openConfirm("activate", admin)}
					className="inline-flex h-8 items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
				>
					<UserCheck size={14} /> Activate
				</button>
			) : (
				<button
					onClick={() => openConfirm("deactivate", admin)}
					className="inline-flex h-8 items-center gap-1 text-[11px] font-bold text-red-500 hover:underline"
				>
					<UserX size={14} /> Deactivate
				</button>
			)}
                                          </div>
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
								? "Deactivate admin"
								: "Activate admin"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingAction?.type === "activate"
								? `Are you sure you want to deactivate ${pendingAction?.name}?`
								: `Are you sure you want to Activate ${pendingAction?.name}?`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirm}
							disabled={isWorking || !pendingAction}
							className={
								pendingAction?.type === "deactivate"
									? "bg-emerald-600 hover:bg-emerald-700"
									: "bg-red-600 hover:bg-red-700"
									
							}
						>
							{isWorking
								? "Please wait..."
								: pendingAction?.type === "activate"
									? "Deactivate"
									: "Activate"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
