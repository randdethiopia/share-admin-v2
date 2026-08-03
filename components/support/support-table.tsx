"use client";

import { MoreHorizontal } from "lucide-react";

import {
	formatCategoryLabel,
	formatTicketDate,
} from "@/components/support/support.constants";
import { StatusBadge } from "@/components/support/status-badge";
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

function TableSkeleton() {
	return (
		<>
			{Array.from({ length: 5 }).map((_, index) => (
				<TableRow key={index}>
					<TableCell><Skeleton className="h-4 w-20" /></TableCell>
					<TableCell><Skeleton className="h-4 w-36" /></TableCell>
					<TableCell><Skeleton className="h-4 w-48" /></TableCell>
					<TableCell><Skeleton className="h-4 w-24" /></TableCell>
					<TableCell><Skeleton className="h-4 w-28" /></TableCell>
					<TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
					<TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
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
		<div className="rounded-xl border-0 bg-card p-6 shadow-xs">
			<Table>
				<TableHeader>
					<TableRow className="bg-[#F9F9F9] hover:bg-[#F9F9F9]">
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Ticket #
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Submitter / Email
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Subject
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Category
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Created At
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
							<TableCell colSpan={7} className="h-40 text-center text-sm text-muted-foreground">
								No support tickets found. Try changing your filters.
							</TableCell>
						</TableRow>
					) : (
						tickets.map((ticket) => (
							<TableRow key={ticket._id}>
								<TableCell className="font-semibold text-agar-navy">
									{ticket.ticketNumber || ticket._id}
								</TableCell>
								<TableCell>
									<div className="flex flex-col">
										<span className="font-semibold text-foreground">
											{ticket.name || ticket.submitterName || "Customer"}
										</span>
										<span className="text-xs text-muted-foreground">
											{ticket.email || ticket.submitterEmail || "-"}
										</span>
									</div>
								</TableCell>
								<TableCell className="max-w-[240px] truncate">
									{ticket.subject}
								</TableCell>
								<TableCell>{formatCategoryLabel(ticket.category)}</TableCell>
								<TableCell>{formatTicketDate(ticket.createdAt)}</TableCell>
								<TableCell>
									<StatusBadge status={ticket.status} />
								</TableCell>
								<TableCell className="text-right">
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
											<DropdownMenuItem onClick={() => onViewTicket(ticket._id)}>
												View Ticket & Reply
											</DropdownMenuItem>
											<DropdownMenuItem
												disabled={isClosedStatus(ticket.status)}
												onClick={() => onMarkClosed(ticket._id)}
											>
												Mark as Closed
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))
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
		</div>
	);
}
