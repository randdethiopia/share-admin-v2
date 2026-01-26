"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BlogApi, { type BlogType } from "@/api/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/shared/PaginationControls";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";
import { Check, Eye, Loader2, Search, X } from "lucide-react";
import { format } from "date-fns";

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED";
type ConfirmAction = "approve" | "reject";

function safeFormatDate(value?: string) {
	if (!value) return "Not Approved";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Not Approved";
	return format(date, "EEEE, MMMM dd, yyyy");
}

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function statusBadgeClass(status: string) {
	if (status === "APPROVED") return "bg-[#34A853] text-white";
	if (status === "REJECTED") return "bg-red-500 text-white";
	return "bg-[#F59E0B] text-white";
}

export default function BlogsPage() {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [page, setPage] = useState(1);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmAction, setConfirmAction] = useState<ConfirmAction>("approve");
	const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);

	const {
		data: blogs = [],
		isLoading,
		isError,
		error,
	} = BlogApi.GetList.useQuery();

	const { mutate: approveBlog, isPending: isApproving } =
		BlogApi.Approve.useMutation({
			onSuccess: () => setConfirmOpen(false),
		});
	const { mutate: rejectBlog, isPending: isRejecting } = BlogApi.Reject.useMutation({
		onSuccess: () => setConfirmOpen(false),
	});

	const filteredData = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (blogs as BlogType[]).filter((blog) => {
			const titleMatch = blog.title?.toLowerCase().includes(query);
			const authorMatch = blog.advisor?.fullName?.toLowerCase().includes(query);
			const matchText = !query || Boolean(titleMatch || authorMatch);

			const status = normalizeStatus(blog.status);
			const matchStatus = statusFilter === "all" || status === statusFilter;

			return matchText && matchStatus;
		});
	}, [blogs, search, statusFilter]);

	const pagination = useMemo(
		() => getPaginationMeta(filteredData.length, page, DEFAULT_PAGE_SIZE),
		[filteredData.length, page]
	);
	const pageData = useMemo(() => {
		return filteredData.slice(pagination.startIndex, pagination.endIndexExclusive);
	}, [filteredData, pagination.startIndex, pagination.endIndexExclusive]);

	const openConfirm = (action: ConfirmAction, id: string) => {
		setConfirmAction(action);
		setSelectedBlogId(id);
		setConfirmOpen(true);
	};

	const openDetails = (id: string) => {
		router.push(`/blogs/${id}`);
	};

	const submitConfirm = () => {
		if (!selectedBlogId) return;
		if (confirmAction === "approve") approveBlog(selectedBlogId);
		else rejectBlog(selectedBlogId);
	};

	const isWorking = isApproving || isRejecting;

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8 space-y-6">
			<div className="px-4">
				<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
					Blog Requests
				</h1>
				<p className="text-zinc-600 text-sm font-medium">
					See all blog requests here
				</p>
			</div>

			<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-sm border border-blue-50">
				<div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search"
							className="pl-11 bg-[#F3F8FF] border-none h-12 rounded-xl"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-3">
						<span className="text-xs font-bold text-gray-400">Filter</span>
						<Select
							value={statusFilter}
							onValueChange={(v) => {
								setStatusFilter(v as StatusFilter);
								setPage(1);
							}}
						>
							<SelectTrigger className="w-full sm:w-40 md:w-35 bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold">
								<SelectValue placeholder="All" />
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

				{/* Mobile: Card list */}
				<div className="md:hidden space-y-3">
					{isLoading ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-600">
							<Loader2 className="animate-spin mr-2" /> Loading...
						</div>
					) : isError ? (
						<div className="h-40 flex items-center justify-center text-sm text-red-600 text-center px-2">
							{(error as { response?: { data?: { message?: string } } })?.response?.data
								?.message || "Failed to load blogs"}
						</div>
					) : filteredData.length === 0 ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-500">
							No blog requests found.
						</div>
					) : (
						pageData.map((blog) => {
							const status = normalizeStatus(blog.status);
							return (
								<div
									key={blog._id}
									className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="text-sm font-bold text-gray-900 truncate">
												{blog.title}
											</p>
											<p className="text-xs text-gray-600 truncate">
												Written by: {blog.advisor?.fullName || "-"}
											</p>
											<p className="text-[11px] text-gray-500 mt-1">
												Approved: {safeFormatDate(blog.approvedAt)}
											</p>
										</div>

										<div className="flex items-center gap-2">
										<Badge
											className={cn(
												"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
												statusBadgeClass(status)
											)}
										>
											{status}
										</Badge>
										<Button
											variant="ghost"
											size="icon"
											title="View details"
											onClick={() => openDetails(blog._id)}
											className="h-9 w-9 rounded-xl bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100 disabled:opacity-60"
										>
											<Eye size={16} />
										</Button>
									</div>
								</div>

								{status === "PENDING" && (
									<div className="mt-3 flex gap-2">
										<Button
											variant="outline"
											disabled={isWorking}
											onClick={() => openConfirm("reject", blog._id)}
											className="w-1/2 rounded-xl"
										>
											<X size={16} /> Reject
										</Button>
										<Button
											disabled={isWorking}
											onClick={() => openConfirm("approve", blog._id)}
											className="w-1/2 rounded-xl bg-blue-600 hover:bg-blue-700"
										>
											<Check size={16} /> Approve
										</Button>
									</div>
								)}
							</div>
						);
						})
					)}
				</div>

				{/* Desktop: Table */}
				<div className="hidden md:block rounded-2xl border border-gray-100 overflow-hidden">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-[#D6E6F2]">
								<TableRow className="border-none hover:bg-transparent">
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Info
									</TableHead>
									<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
										Approved Date
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
										<TableCell colSpan={4} className="h-40 text-center">
											<Loader2 className="animate-spin inline mr-2" /> Loading...
										</TableCell>
									</TableRow>
								) : isError ? (
									<TableRow>
										<TableCell colSpan={4} className="h-40 text-center text-sm text-red-600">
											{(error as { response?: { data?: { message?: string } } })?.response?.data
												?.message || "Failed to load blogs"}
										</TableCell>
									</TableRow>
								) : filteredData.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="h-40 text-center text-sm text-gray-500">
											No blog requests found.
										</TableCell>
									</TableRow>
								) : (
									pageData.map((blog) => {
										const status = normalizeStatus(blog.status);
										return (
											<TableRow
												key={blog._id}
												className="hover:bg-slate-50/50 border-gray-50"
											>
												<TableCell className="px-6 py-4">
													<div className="text-xs font-bold text-gray-800">
														{blog.title}
													</div>
													<div className="text-[10px] text-gray-400">
														<span className="font-bold">Written By:</span>{" "}
														{blog.advisor?.fullName || "-"}
													</div>
												</TableCell>
												<TableCell className="px-6 py-4 text-[11px] text-gray-500 font-medium">
													{safeFormatDate(blog.approvedAt)}
												</TableCell>
												<TableCell className="px-6 py-4">
													<Badge
														className={cn(
															"rounded-md px-3 py-0.5 text-[10px] font-bold border-none",
															statusBadgeClass(status)
														)}
													>
														{status}
													</Badge>
												</TableCell>
												<TableCell className="px-6 py-4">
													<div className="flex justify-center gap-2">
														<Button
															variant="ghost"
															size="icon"
															title="View details"
															onClick={() => openDetails(blog._id)}
															className="h-8 w-8 rounded-lg bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100 disabled:opacity-60"
														>
															<Eye size={16} />
														</Button>
														{status === "PENDING" && (
															<>
																<Button
																	onClick={() => openConfirm("approve", blog._id)}
																	disabled={isWorking}
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 rounded-lg bg-[#E6F4EA] text-[#1E8E3E] hover:bg-green-100 disabled:opacity-60"
																	title="Approve"
																>
																	<Check size={16} />
																</Button>
																<Button
																	onClick={() => openConfirm("reject", blog._id)}
																	disabled={isWorking}
																	variant="ghost"
																	size="icon"
																	className="h-8 w-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-60"
																	title="Reject"
																>
																	<X size={16} />
																</Button>
															</>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})
								)
								}
							</TableBody>
						</Table>
					</div>
				</div>

			{/* Pagination */}
			<PaginationControls
				page={page}
				onPageChange={setPage}
				totalItems={filteredData.length}
				pageSize={DEFAULT_PAGE_SIZE}
				disabled={isLoading || isError}
			/>
			</div>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent className="rounded-3xl sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-xl font-bold">
							{confirmAction === "approve" ? "Approve blog" : "Reject blog"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmAction === "approve"
								? "This will approve the blog request."
								: "This will reject the blog request."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl" disabled={isWorking}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isWorking || !selectedBlogId}
							onClick={(e) => {
								e.preventDefault();
								submitConfirm();
							}}
							className={cn(
								"rounded-xl",
								confirmAction === "approve" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"
							)}
						>
							{isWorking ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 className="animate-spin" size={16} />
									Please wait
								</span>
							) : confirmAction === "approve" ? (
								"Approve"
							) : (
								"Reject"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

