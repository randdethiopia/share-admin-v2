"use client";

import * as React from "react";
import { AlertCircle, AtSign, GraduationCap, Mail } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import PaginationControls from "@/components/shared/PaginationControls";
import { cn } from "@/lib/utils";

export type ApplicantListItem = {
	_id: string;
	fullName?: string | null;
	email?: string | null;
	currentEmploymentStatus?: string | null;
	educationLevel?: string | null;
};

type UnknownError = { message?: string };

export interface ApplicantListProps<TApplicant extends ApplicantListItem = ApplicantListItem> {
	isLoading: boolean;
	isError: boolean;
	error?: unknown;
	filteredMessages: TApplicant[];
	selectedMessage: TApplicant | null;
	handleMessageSelect: (message: TApplicant) => void;
	page?: number;
	onPageChange?: (page: number) => void;
	totalItems?: number;
	pageSize?: number;
	getInitials?: (name: string) => string;
	getStatusColor?: (status: string) => string;
}

function defaultGetInitials(name: string) {
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) return "?";
	return parts
		.slice(0, 2)
		.map((p) => p[0] ?? "")
		.join("")
		.toUpperCase();
}

function defaultGetStatusColor(status: string) {
	const s = status.trim().toLowerCase();
	if (!s) return "bg-slate-100 text-slate-700";
	if (s.includes("unemployed")) return "bg-rose-50 text-rose-700";
	if (s.includes("employed")) return "bg-emerald-50 text-emerald-700";
	if (s.includes("student")) return "bg-sky-50 text-sky-700";
	return "bg-slate-100 text-slate-700";
}

type ApplicantRowProps = {
	message: ApplicantListItem;
	isSelected: boolean;
	onSelect: (message: ApplicantListItem) => void;
	getInitials: (name: string) => string;
	getStatusColor: (status: string) => string;
};

const ApplicantRow = React.memo(function ApplicantRow({
	message,
	isSelected,
	onSelect,
	getInitials,
	getStatusColor,
}: ApplicantRowProps) {
	const fullName = (message.fullName ?? "").toString();
	const email = (message.email ?? "").toString();
	const employment = (message.currentEmploymentStatus ?? "").toString();
	const education = (message.educationLevel ?? "").toString();

	return (
		<div
			onClick={() => onSelect(message)}
			className={cn(
				"group relative p-4 rounded-3xl cursor-pointer transition-colors border-2",
				isSelected
					? "border-emerald-500 bg-emerald-50 shadow-sm"
					: "border-transparent bg-white hover:border-slate-200 shadow-sm"
			)}
		>
			<div className="flex items-center gap-3 mb-3">
				<Avatar className="h-12 w-12 border-2 border-white shadow-sm">
					<AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-xs uppercase">
						{getInitials(fullName)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<div className="font-semibold text-slate-900 text-sm truncate">
						{fullName || "—"}
					</div>
					<div className="text-[11px] text-slate-500 flex items-center gap-1">
						<AtSign size={10} />
						<span className="truncate">{email || "—"}</span>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between gap-2">
				<Badge
					variant="secondary"
					className={cn(
						"font-semibold text-[10px] px-2.5 py-0.5 border-none shadow-none uppercase tracking-tight",
						getStatusColor(employment)
					)}
				>
					{employment || "—"}
				</Badge>

				{education && (
					<div className="flex items-center gap-1 text-slate-500">
						<GraduationCap size={12} />
						<span className="text-[10px] font-semibold uppercase tracking-tight">
							{education}
						</span>
					</div>
				)}
			</div>
		</div>
	);
});

export function ApplicantsList<TApplicant extends ApplicantListItem = ApplicantListItem>({
	isLoading,
	isError,
	error,
	filteredMessages,
	selectedMessage,
	handleMessageSelect,
	page,
	onPageChange,
	totalItems,
	pageSize,
	getInitials = defaultGetInitials,
	getStatusColor = defaultGetStatusColor,
}: ApplicantListProps<TApplicant>) {
	const errorMessage = React.useMemo(() => {
		const e = error as UnknownError | undefined;
		return e?.message ?? "Check connection";
	}, [error]);

	const selectedId = selectedMessage?._id ?? null;
	const onSelect = React.useCallback(
		(message: ApplicantListItem) => {
			handleMessageSelect(message as TApplicant);
		},
		[handleMessageSelect]
	);

	return (
		<div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r bg-slate-50 flex flex-col h-full">
			<ScrollArea className="flex-1">
				<div className="p-4 space-y-3">
					{/* 1) LOADING STATE */}
					{isLoading && (
						<>
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center gap-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm"
								>
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-24" />
									</div>
								</div>
							))}
						</>
					)}

					{/* 2) ERROR STATE */}
					{isError && !isLoading && (
						<div className="py-12 text-center px-6">
							<AlertCircle className="h-10 w-10 mx-auto text-rose-500/70 mb-3" />
							<p className="text-sm font-semibold text-slate-900">
								Failed to load data
							</p>
							<p className="text-xs text-slate-500 mt-1">{errorMessage}</p>
						</div>
					)}

					{/* 3) EMPTY STATE */}
					{!isLoading && !isError && filteredMessages.length === 0 && (
						<div className="py-12 text-center px-6">
							<Mail className="h-10 w-10 mx-auto text-slate-300 mb-3" />
							<p className="text-sm font-semibold text-slate-900">
								No applicants found
							</p>
							<p className="text-xs text-slate-500 mt-1">
								Try adjusting your filters
							</p>
						</div>
					)}

					{/* 4) DATA LIST */}
					{!isLoading &&
						!isError &&
						filteredMessages.map((message) => (
							<ApplicantRow
								key={message._id}
								message={message}
								isSelected={selectedId === message._id}
								onSelect={onSelect}
								getInitials={getInitials}
								getStatusColor={getStatusColor}
							/>
						))}
				</div>
			</ScrollArea>

			{typeof page === "number" &&
				typeof onPageChange === "function" &&
				typeof totalItems === "number" &&
				totalItems > 0 && (
					<div className="border-t bg-white p-4">
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

