"use client";

import { useEffect, useMemo, useState } from "react";
import TraineeAuth, { type TraineeType } from "@/api/trainee";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import Link from "next/link";
import { Loader2, Search, Trash2, Upload } from "lucide-react";

type TraineeTypeFilter = "all" | "NORMAL" | "EDGE";
type TraineeStatusFilter = "all" | "active" | "inactive";

function normalizeIsActive(value: unknown) {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value === 1;
	if (typeof value === "string") {
		const v = value.trim().toLowerCase();
		return v === "true" || v === "1" || v === "active";
	}
	return false;
}

export default function TraineePage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [type, setType] = useState<TraineeTypeFilter>("all");
	const [status, setStatus] = useState<TraineeStatusFilter>("all");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isSelectable, setIsSelectable] = useState(false);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmId, setConfirmId] = useState<string | null>(null);

	useEffect(() => {
		const t = setTimeout(() => {
			setSearch(searchInput);
			setPage(1);
		}, 350);
		return () => clearTimeout(t);
	}, [searchInput]);

	const typeParam = useMemo(() => {
		return type === "all" ? undefined : type;
	}, [type]);

	const statusParam = useMemo(() => {
		return status === "all" ? undefined : status;
	}, [status]);

	const {
		data,
		isLoading,
		isError,
		error,
	} = TraineeAuth.GetTrainee.useQuery(
		page,
		pageSize,
		typeParam,
		search.trim() || undefined,
		statusParam
	);

	const trainees = useMemo(() => data?.data ?? [], [data]);
	const totalItems = data?.meta?.totalItems ?? 0;

	const visibleTrainees = useMemo(() => {
		if (status === "active") {
			return trainees.filter((t) => normalizeIsActive(t.isActive));
		}
		if (status === "inactive") {
			return trainees.filter((t) => !normalizeIsActive(t.isActive));
		}
		return trainees;
	}, [trainees, status]);

	const {
		mutate: deleteTrainee,
		isPending: isDeleting,
	} = TraineeAuth.DeleteTrainee.useMutation({
		onSuccess: () => {
			setConfirmOpen(false);
			setConfirmId(null);
			setSelectedIds([]);
		},
	});

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const allChecked =
		visibleTrainees.length > 0 && selectedIds.length === visibleTrainees.length;
	const someChecked =
		selectedIds.length > 0 && selectedIds.length < visibleTrainees.length;

	const toggleAll = (checked: boolean | "indeterminate") => {
		if (checked === true) {
			setSelectedIds(visibleTrainees.map((t) => t._id));
			return;
		}
		setSelectedIds([]);
	};

	const openDeleteConfirm = (id: string) => {
		setConfirmId(id);
		setConfirmOpen(true);
	};

	const confirmDelete = () => {
		if (!confirmId) return;
		deleteTrainee(confirmId);
	};

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8 space-y-6">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
				<div className="space-y-1">
					<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
						Trainee
					</h1>
					<p className="text-zinc-600 text-sm font-medium">See all your trainees</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button
						variant="outline"
						onClick={() =>
							setIsSelectable((v) => {
								const next = !v;
								if (!next) setSelectedIds([]);
								return next;
							})
						}
						className={cn(
							"rounded-xl font-bold",
							isSelectable
								? "border-gray-300 text-gray-700"
								: "border-emerald-500 text-emerald-600"
						)}
					>
						{isSelectable ? "Cancel Selection" : "Bulk Assign"}
					</Button>
					{isSelectable && (
						<Button
							className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 font-bold"
							onClick={() => {
								setIsSelectable(false);
								setSelectedIds([]);
							}}
							disabled={selectedIds.length === 0}
						>
							Done
						</Button>
					)}
					<Button
						asChild
						className="bg-[#10B981] hover:bg-emerald-600 rounded-xl px-6 font-bold"
					>
						<Link href="/trainee/list/create-trainee">Create</Link>
					</Button>
					<Button className="bg-[#10B981] hover:bg-emerald-600 rounded-xl px-6 font-bold">
						<Upload size={16} className="mr-2" />
						Import
					</Button>
				</div>
			</div>

			<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-sm border border-blue-50 min-h-[70vh]">
				<div className="flex flex-col md:flex-row justify-between gap-3 mb-6">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Enter name or phone..."
							className="pl-11 bg-[#F3F8FF] border-none h-12 rounded-xl text-sm"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
						/>
					</div>

						<div className="flex flex-col sm:flex-row sm:items-end gap-2">
						<div className="w-full sm:w-36">
							<label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">
								Type
							</label>
							<Select
								value={type}
								onValueChange={(v) => {
									if (v === "all" || v === "NORMAL" || v === "EDGE") {
										setType(v);
										setPage(1);
									}
								}}
							>
								<SelectTrigger className="bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold text-gray-700">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="NORMAL">Normal</SelectItem>
									<SelectItem value="EDGE">Edge</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="w-full sm:w-36">
							<label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">
								Status
							</label>
							<Select
								value={status}
								onValueChange={(v) => {
									if (v === "all" || v === "active" || v === "inactive") {
										setStatus(v);
										setPage(1);
									}
								}}
							>
								<SelectTrigger className="bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold text-gray-700">
									<SelectValue placeholder="All" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="w-full sm:w-40">
							<label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">
								Rows per page
							</label>
							<Select
								value={String(pageSize)}
								onValueChange={(v) => {
									const next = Number(v);
									setPageSize(Number.isFinite(next) && next > 0 ? next : 10);
									setPage(1);
								}}
							>
								<SelectTrigger className="bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold text-gray-700">
									<SelectValue placeholder="10" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="20">20</SelectItem>
									<SelectItem value="50">50</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* Mobile cards */}
				<div className="md:hidden space-y-3">
					{isLoading ? (
						<div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600">
							<Loader2 className="inline mr-2 animate-spin" size={16} />
							Loading...
						</div>
					) : isError ? (
						<div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
							{(error as { response?: { data?: { message?: string } } })
								?.response?.data?.message || "Failed to load trainees"}
						</div>
					) : visibleTrainees.length === 0 ? (
						<div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-600">
							No trainees found.
						</div>
					) : (
						visibleTrainees.map((t: TraineeType) => (
							<div
								key={t._id}
								className="rounded-2xl border border-gray-100 bg-white p-4"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="truncate text-sm font-bold text-gray-900">
											{t.firstname} {t.lastname}
										</div>
										<div className="mt-1 text-xs text-gray-600">
											<span className="font-semibold">Phone:</span> {t.phoneNumber || "-"}
										</div>
										<div className="mt-1 text-xs text-gray-600">
											<span className="font-semibold">Referral:</span> {t.referralCode || "NONE"}
										</div>
									</div>

									<div className="flex items-center gap-2">
										{isSelectable && (
											<Checkbox
												checked={selectedIds.includes(t._id)}
												onCheckedChange={() => toggleSelect(t._id)}
											/>
										)}

										<Button
											variant="ghost"
											size="icon"
											title="Delete"
											onClick={() => openDeleteConfirm(t._id)}
											disabled={isDeleting}
											className="h-9 w-9 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-60"
										>
											<Trash2 size={16} />
										</Button>
									</div>
								</div>

								<div className="mt-3 flex flex-wrap items-center gap-2">
									<span className="rounded-md bg-[#F3F8FF] px-3 py-1 text-[10px] font-extrabold uppercase text-gray-600">
										{t.type || "-"}
									</span>
									<span
										className={cn(
											"rounded-md px-3 py-1 text-[10px] font-bold",
											normalizeIsActive(t.isActive)
												? "bg-[#E6F4EA] text-[#1E8E3E]"
												: "bg-red-50 text-red-600"
										)
									}
									>
										{normalizeIsActive(t.isActive) ? "Active" : "Inactive"}
									</span>
								</div>

								<Button
									variant="link"
									className="mt-2 h-auto p-0 text-[11px] font-bold text-blue-600"
									onClick={() => setIsSelectable(true)}
							>
								Add to Cohort
							</Button>
						</div>
						))
					)}
				</div>

				{/* Desktop table */}
				<div className="hidden md:block rounded-2xl border border-gray-100 overflow-hidden">
					<div className="w-full overflow-x-auto">
						<Table className="w-full min-w-225">
							<TableHeader className="bg-[#D6E6F2]">
								<TableRow className="hover:bg-transparent border-none">
									{isSelectable && (
										<TableHead className="w-12 px-6">
											<Checkbox
												checked={
													allChecked
														? true
													: someChecked
														? "indeterminate"
														: false
												}
												onCheckedChange={toggleAll}
												disabled={isLoading || visibleTrainees.length === 0}
											/>
										</TableHead>
									)}
									<TableHead className="font-bold text-slate-700 h-12 px-6">
										Name
									</TableHead>
									<TableHead className="font-bold text-slate-700 h-12 px-6">
										Phone Number
									</TableHead>
									<TableHead className="font-bold text-slate-700 h-12 px-6">
										Referral
									</TableHead>
									<TableHead className="font-bold text-slate-700 h-12 px-6">
										Type
									</TableHead>
									<TableHead className="font-bold text-slate-700 h-12 px-6">
										Status
									</TableHead>
									<TableHead className="font-bold text-slate-700 h-12 px-6">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell
											colSpan={isSelectable ? 7 : 6}
											className="h-40 text-center"
										>
											<Loader2 className="animate-spin inline mr-2" />
											Loading...
										</TableCell>
									</TableRow>
								) : isError ? (
									<TableRow>
										<TableCell
											colSpan={isSelectable ? 7 : 6}
											className="h-40 text-center text-sm text-red-600"
										>
											{(error as { response?: { data?: { message?: string } } })
												?.response?.data?.message || "Failed to load trainees"}
										</TableCell>
									</TableRow>
								) : visibleTrainees.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={isSelectable ? 7 : 6}
											className="h-40 text-center text-sm text-gray-500"
										>
											No trainees found.
										</TableCell>
									</TableRow>
								) : (
									visibleTrainees.map((t: TraineeType) => (
										<TableRow
											key={t._id}
											className="hover:bg-slate-50/50 border-gray-50"
										>
											{isSelectable && (
												<TableCell className="px-6">
													<Checkbox
														checked={selectedIds.includes(t._id)}
														onCheckedChange={() => toggleSelect(t._id)}
													/>
												</TableCell>
											)}
											<TableCell className="px-6 py-4 font-bold text-gray-700">
												{t.firstname} {t.lastname}
											</TableCell>
											<TableCell className="px-6 py-4 text-xs font-medium text-gray-600">
												{t.phoneNumber || "-"}
											</TableCell>
											<TableCell className="px-6 py-4 text-xs font-bold text-gray-400">
												{t.referralCode || "NONE"}
											</TableCell>
											<TableCell className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase">
												{t.type || "-"}
											</TableCell>
											<TableCell className="px-6 py-4">
												<span
													className={cn(
														"inline-flex items-center rounded-md px-3 py-1 text-[10px] font-bold",
														normalizeIsActive(t.isActive)
															? "bg-[#E6F4EA] text-[#1E8E3E]"
															: "bg-red-50 text-red-600"
													)
												}
											>
												{normalizeIsActive(t.isActive) ? "Active" : "Inactive"}
											</span>
										</TableCell>
											<TableCell className="px-6 py-4">
												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="icon"
														title="Delete"
														onClick={() => openDeleteConfirm(t._id)}
														disabled={isDeleting}
														className="h-8 w-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-60"
													>
														<Trash2 size={14} />
													</Button>
													<Button
														variant="link"
														className="h-auto p-0 text-[10px] font-bold text-blue-600"
														onClick={() => setIsSelectable(true)}
													>
														Add to Cohort
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</div>

				<PaginationControls
					page={page}
					onPageChange={setPage}
					totalItems={totalItems}
					pageSize={pageSize}
					disabled={isLoading || isError}
				/>
			</div>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent className="rounded-3xl sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-xl font-bold">
							Delete trainee
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the trainee.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl" disabled={isDeleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isDeleting || !confirmId}
							onClick={(e) => {
								e.preventDefault();
								confirmDelete();
							}}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{isDeleting ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 className="animate-spin" size={16} />
									Please wait
								</span>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
