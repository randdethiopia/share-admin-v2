"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InvitationApi, { type InvitationType } from "@/api/invitation";
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
import { Eye, Loader2, Search } from "lucide-react";

type SortMode = "newest" | "oldest";
type InvitationRow = InvitationType & { createdAt?: string | Date };

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toLowerCase();
}

export default function InvitationsPage() {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<SortMode>("newest");

	const {
		data: invitations = [],
		isLoading,
		isError,
		error,
	} = InvitationApi.GetList.useQuery();

	const filteredData = useMemo(() => {
		const rows = invitations as InvitationRow[];
		const query = search.trim().toLowerCase();

		const filtered = query
			? rows.filter((inv) => {
				const smeName = inv.company?.businessName?.toLowerCase() ?? "";
				const advisorName = inv.advisor?.fullName?.toLowerCase() ?? "";
				return smeName.includes(query) || advisorName.includes(query);
			})
			: rows;

		const sorted = [...filtered].sort((a, b) => {
			const aTime = new Date(a.createdAt ?? 0).getTime();
			const bTime = new Date(b.createdAt ?? 0).getTime();
			return sort === "newest" ? bTime - aTime : aTime - bTime;
		});

		return sorted;
	}, [invitations, search, sort]);

	const handleSortChange = (value: string) => {
		if (value === "newest" || value === "oldest") setSort(value);
	};

	const openDetails = (id: string) => {
		router.push(`/invitations/${id}`);
	};

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8 space-y-6">
			<div className="px-4">
				<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
					Job Invitations
				</h1>
				<p className="text-zinc-600 text-sm font-medium">See your Invitations</p>
			</div>

			<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-sm border border-blue-50 min-h-[70vh]">
				<div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
					<div className="relative w-full max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search"
							className="pl-11 bg-[#F3F8FF] border-none h-12 rounded-xl text-sm"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-3">
						<span className="text-xs font-bold text-gray-400">Sort By</span>
						<Select value={sort} onValueChange={handleSortChange}>
							<SelectTrigger className="w-full sm:w-40 md:w-35 bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold">
								<SelectValue placeholder="Newest First" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">Newest First</SelectItem>
								<SelectItem value="oldest">Oldest First</SelectItem>
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
								?.message || "Failed to load invitations"}
						</div>
					) : filteredData.length === 0 ? (
						<div className="h-40 flex items-center justify-center text-sm text-gray-500">
							No invitations found.
						</div>
					) : (
						filteredData.map((item) => {
							const status = normalizeStatus(item.status);
							const statusClass = status.includes("accept")
								? "bg-[#34A853] text-white"
								: status.includes("reject")
									? "bg-red-500 text-white"
									: "bg-[#F59E0B] text-white";

							return (
								<div
									key={item._id}
									className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="text-sm font-bold text-gray-900 truncate">
												{item.company?.businessName || "-"}
											</p>
											<p className="text-xs text-gray-600 truncate">
												{item.advisor?.fullName || "-"}
											</p>
										</div>

									<div className="flex items-center gap-2">
										<Badge
											className={cn(
												"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
												statusClass
											)}
										>
											{item.status || "-"}
										</Badge>
										<Button
											variant="ghost"
											size="icon"
											title="View details"
											onClick={() => openDetails(item._id)}
											className="h-9 w-9 rounded-xl bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
										>
											<Eye size={16} />
										</Button>
									</div>
								</div>

								<div className="mt-3 grid grid-cols-2 gap-3">
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Duration
										</p>
										<p className="text-xs font-semibold text-gray-700">
											{item.duration || "-"}
										</p>
									</div>
									<div className="rounded-xl bg-[#F3F8FF] px-3 py-2">
										<p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
											Payment
										</p>
										<p className="text-xs font-semibold text-gray-700">
											{item.paymentTerm || "-"}
										</p>
									</div>
								</div>
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
									Business
								</TableHead>
								<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
									Expert
								</TableHead>
								<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
									Duration
								</TableHead>
								<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
									Payment Term
								</TableHead>
								<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider">
									Status
								</TableHead>
								<TableHead className="font-bold text-[#4A5568] h-12 px-6 text-[11px] uppercase tracking-wider text-center">
									Action
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={6} className="h-40 text-center">
										<Loader2 className="animate-spin inline mr-2" />
										Loading...
									</TableCell>
								</TableRow>
							) : isError ? (
								<TableRow>
									<TableCell colSpan={6} className="h-40 text-center text-sm text-red-600">
										{(error as { response?: { data?: { message?: string } } })?.response?.data
											?.message || "Failed to load invitations"}
									</TableCell>
								</TableRow>
							) : filteredData.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className="h-40 text-center text-sm text-gray-500">
										No invitations found.
									</TableCell>
								</TableRow>
							) : (
								filteredData.map((item) => {
									const status = normalizeStatus(item.status);
									const statusClass = status.includes("accept")
										? "bg-[#34A853] text-white"
										: status.includes("reject")
											? "bg-red-500 text-white"
											: "bg-[#F59E0B] text-white";

									return (
										<TableRow
											key={item._id}
											className="hover:bg-slate-50/50 border-gray-50"
										>
											<TableCell className="px-6 py-4 text-xs font-bold text-gray-600">
												{item.company?.businessName || "-"}
											</TableCell>
											<TableCell className="px-6 py-4 text-xs font-bold text-gray-600">
												{item.advisor?.fullName || "-"}
											</TableCell>
											<TableCell className="px-6 py-4 text-xs text-gray-500 font-medium">
												{item.duration || "-"}
											</TableCell>
											<TableCell className="px-6 py-4 text-xs text-gray-500 font-medium">
												{item.paymentTerm || "-"}
											</TableCell>
											<TableCell className="px-6 py-4">
												<Badge
													className={cn(
														"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
														statusClass
													)}
												>
													{item.status || "-"}
												</Badge>
											</TableCell>
											<TableCell className="px-6 py-4 text-center">
												<Button
													variant="ghost"
													size="icon"
													title="View details"
													onClick={() => openDetails(item._id)}
													className="h-8 w-8 rounded-lg bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
												>
													<Eye size={16} />
												</Button>
											</TableCell>
									</TableRow>
									);
								})
							)}
						</TableBody>
						</Table>
					</div>
				</div>
			</div>
		</div>
	);
}

