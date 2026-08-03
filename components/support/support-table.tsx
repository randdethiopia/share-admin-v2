"use client";

import { CheckCircle, Eye, MoreHorizontal } from "lucide-react";

import { formatRelativeTime } from "@/components/support/support.constants";
import { CategoryBadge, StatusBadge } from "@/components/support/status-badge";
import PaginationControls from "@/components/shared/PaginationControls";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { SupportTicketType } from "@/lib/api/support.types";
import { TicketStatus } from "@/lib/api/support.types";
import { cn } from "@/lib/utils";

type SupportTableProps = {
	tickets: SupportTicketType[];
	loading: boolean;
	page: number;
	totalItems: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onViewTicket: (id: string) => void;
	onMarkClosed: (id: string) => void;
};

function getRowUrgencyClass(status: TicketStatus) {
	if (status === TicketStatus.NEW) {
		return "bg-amber-500/5 border-l-4 border-amber-500";
	}
	if (status === TicketStatus.ANSWERED) {
		return "bg-emerald-500/5";
	}
	if (status === TicketStatus.CLOSED || status === TicketStatus.ARCHIVED) {
		return "bg-slate-50 opacity-75";
	}
	return "";
}

function TableSkeleton() {
	return (
		<>
			{Array.from({ length: 5 }).map((_, index) => (
				<TableRow key={index}>
					<TableCell><Skeleton className="h-10 w-40" /></TableCell>
					<TableCell><Skeleton className="h-10 w-56" /></TableCell>
					<TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
					<TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
					<TableCell><Skeleton className="h-8 w-8" /></TableCell>
				</TableRow>
			))}
		</>
	);
}

export function SupportTable({
	tickets,
	loading,
	page,
	totalItems,
	pageSize,
	onPageChange,
	onViewTicket,
	onMarkClosed,
}: SupportTableProps) {
	const isClosedStatus = (status: TicketStatus) =>
		status === TicketStatus.CLOSED || status === TicketStatus.ARCHIVED;

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/40 hover:bg-muted/40">
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Customer
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Subject
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Category
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Status
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider text-right">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						<TableSkeleton />
					) : tickets.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={5}
								className="h-40 text-center text-sm text-muted-foreground"
							>
								No support tickets found. Everything is resolved!
							</TableCell>
						</TableRow>
					) : (
						tickets.map((ticket) => {
							const customerName =
								ticket.name || ticket.submitterName || "Customer";
							const customerEmail =
								ticket.email || ticket.submitterEmail || "-";
							const relativeTime = formatRelativeTime(ticket.createdAt);

							return (
								<TableRow
									key={ticket._id}
									className={cn(
										"transition-colors hover:bg-muted/30",
										getRowUrgencyClass(ticket.status)
									)}
								>
									<TableCell>
										<div className="flex flex-col gap-0.5">
											<span className="text-sm font-semibold text-foreground">
												{customerName}
											</span>
											<span className="text-xs text-muted-foreground">
												{customerEmail}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex max-w-[360px] flex-col gap-1">
											<span className="line-clamp-2 font-medium text-foreground">
												{ticket.subject}
											</span>
											<span
												className="text-xs text-muted-foreground"
												title={relativeTime.title}
											>
												{relativeTime.label}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<CategoryBadge category={ticket.category} />
									</TableCell>
									<TableCell>
										<StatusBadge status={ticket.status} />
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
														aria-label="Ticket actions"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-52">
													<DropdownMenuItem
														onClick={() => onViewTicket(ticket._id)}
														className="flex cursor-pointer items-center gap-2"
													>
														<Eye className="h-4 w-4 text-primary" />
														View & Reply
													</DropdownMenuItem>
													<DropdownMenuItem
														disabled={isClosedStatus(ticket.status)}
														onClick={() => onMarkClosed(ticket._id)}
														className="flex cursor-pointer items-center gap-2"
													>
														<CheckCircle className="h-4 w-4 text-muted-foreground" />
														Mark as Closed
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>

			<PaginationControls
				page={page}
				onPageChange={onPageChange}
				totalItems={totalItems}
				pageSize={pageSize}
				disabled={loading}
			/>
		</>
	);
}
