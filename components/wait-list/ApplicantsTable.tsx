"use client";

import * as React from "react";
import { AlertCircle, Mail } from "lucide-react";

import PaginationControls from "@/components/shared/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ApplicantListItem } from "@/lib/api/waitlist";
import { formatEmploymentStatus } from "@/lib/api/applicantLabels";
import { cn } from "@/lib/utils";

const tableHeadClass =
	"h-11 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-8";

type UnknownError = { message?: string };

export interface ApplicantsTableProps {
	isLoading: boolean;
	isError: boolean;
	error?: unknown;
	filteredMessages: ApplicantListItem[];
	selectedId: string | null;
	onRowSelect: (message: ApplicantListItem) => void;
	page?: number;
	onPageChange?: (page: number) => void;
	totalItems?: number;
	pageSize?: number;
	stageLabels?: Record<string, string>;
}

function formatStage(stage: string | null | undefined, stageLabels: Record<string, string>) {
	if (!stage) return "—";
	return stageLabels[stage] ?? stage;
}

function getStatusColor(status: string) {
	const s = status.trim().toLowerCase();
	if (!s) return "bg-slate-100 text-slate-700";
	if (s.includes("unemployed")) return "bg-rose-50 text-rose-700";
	if (s.includes("employed")) return "bg-emerald-50 text-emerald-700";
	if (s.includes("student")) return "bg-sky-50 text-sky-700";
	return "bg-slate-100 text-slate-700";
}

function applicantName(applicant: ApplicantListItem) {
	return [applicant.firstName, applicant.middleName, applicant.lastName]
		.filter(Boolean)
		.join(" ");
}

export function ApplicantsTable({
	isLoading,
	isError,
	error,
	filteredMessages,
	selectedId,
	onRowSelect,
	page,
	onPageChange,
	totalItems,
	pageSize,
	stageLabels = {},
}: ApplicantsTableProps) {
	const errorMessage = React.useMemo(() => {
		const e = error as UnknownError | undefined;
		return e?.message ?? "Check connection";
	}, [error]);

	return (
		<div className="flex flex-col">
			<div className="w-full overflow-x-auto">
				<Table>
					<TableHeader className="bg-slate-50 border-b border-slate-200/80">
						<TableRow className="hover:bg-transparent">
							<TableHead className={tableHeadClass}>Name</TableHead>
							<TableHead className={cn(tableHeadClass, "hidden md:table-cell")}>
								Email
							</TableHead>
							<TableHead className={tableHeadClass}>Status</TableHead>
							<TableHead className={cn(tableHeadClass, "hidden lg:table-cell")}>
								Batch
							</TableHead>
							<TableHead className={cn(tableHeadClass, "hidden sm:table-cell")}>
								Stage
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading &&
							Array.from({ length: 7 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell className="px-6 py-4">
										<Skeleton className="h-4 w-40" />
									</TableCell>
									<TableCell className="hidden md:table-cell px-6 py-4">
										<Skeleton className="h-4 w-48" />
									</TableCell>
									<TableCell className="px-6 py-4">
										<Skeleton className="h-5 w-24 rounded-full" />
									</TableCell>
									<TableCell className="hidden lg:table-cell px-6 py-4">
										<Skeleton className="h-4 w-16" />
									</TableCell>
									<TableCell className="hidden sm:table-cell px-6 py-4">
										<Skeleton className="h-4 w-28" />
									</TableCell>
								</TableRow>
							))}

						{isError && !isLoading && (
							<TableRow>
								<TableCell colSpan={5} className="py-16 text-center">
									<AlertCircle className="h-10 w-10 mx-auto text-rose-500/70 mb-3" />
									<p className="text-sm font-semibold text-slate-900">
										Failed to load data
									</p>
									<p className="text-xs text-slate-500 mt-1">{errorMessage}</p>
								</TableCell>
							</TableRow>
						)}

						{!isLoading && !isError && filteredMessages.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="py-16 text-center">
									<Mail className="h-10 w-10 mx-auto text-slate-300 mb-3" />
									<p className="text-sm font-semibold text-slate-900">
										No applicants found
									</p>
									<p className="text-xs text-slate-500 mt-1">
										Try adjusting your filters
									</p>
								</TableCell>
							</TableRow>
						)}

						{!isLoading &&
							!isError &&
							filteredMessages.map((message) => {
								const fullName = applicantName(message);
								const employmentLabel = formatEmploymentStatus(
									message.employmentStatus
								);
								const isSelected = selectedId === message._id;

								return (
									<TableRow
										key={message._id}
										onClick={() => onRowSelect(message)}
										className={cn(
											"cursor-pointer border-b border-slate-100 transition-colors",
											isSelected
												? "bg-emerald-50/80 hover:bg-emerald-50"
												: "hover:bg-slate-50/80"
										)}
									>
										<TableCell className="px-6 py-4 font-semibold text-sm text-slate-900">
											{fullName || "—"}
										</TableCell>
										<TableCell className="hidden md:table-cell px-6 py-4 text-sm text-slate-600">
											{message.email || "—"}
										</TableCell>
										<TableCell className="px-6 py-4">
											<Badge
												variant="secondary"
												className={cn(
													"font-semibold text-[10px] px-2.5 py-0.5 border-none shadow-none uppercase tracking-tight",
													getStatusColor(employmentLabel)
												)}
											>
												{employmentLabel || "—"}
											</Badge>
										</TableCell>
										<TableCell className="hidden lg:table-cell px-6 py-4 text-sm text-slate-600">
											{message.batch || "—"}
										</TableCell>
										<TableCell className="hidden sm:table-cell px-6 py-4 text-sm text-slate-600">
											{formatStage(message.stage, stageLabels)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
			</div>

			{typeof page === "number" &&
				typeof onPageChange === "function" &&
				typeof totalItems === "number" &&
				totalItems > 0 && (
					<div className="border-t border-slate-200/80 bg-white px-6 py-4">
						<PaginationControls
							page={page}
							onPageChange={onPageChange}
							totalItems={totalItems}
							pageSize={pageSize}
							disabled={isLoading}
							showRange={false}
							className="mt-0"
							paginationClassName="justify-start"
						/>
					</div>
				)}
		</div>
	);
}
