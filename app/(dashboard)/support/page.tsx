"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/admin/PageHeader";
import { SupportFilterBar } from "@/components/support/support-filter-bar";
import { SupportMetrics } from "@/components/support/support-metrics";
import { SupportTable } from "@/components/support/support-table";
import { TicketDetailDialog } from "@/components/support/ticket-detail-dialog";
import {
	buildListQueryParams,
	DEFAULT_CATEGORY,
	DEFAULT_PAGE_SIZE,
	DEFAULT_STATUS,
	type StatusFilter,
} from "@/components/support/support.constants";
import api from "@/lib/api";
import type {
	SupportTicketType,
	TicketListData,
} from "@/lib/api/support.types";
import { TicketStatus } from "@/lib/api/support.types";

export default function SupportPage() {
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<StatusFilter>(DEFAULT_STATUS);
	const [search, setSearch] = useState("");

	const queryParams = useMemo(
		() =>
			buildListQueryParams({
				page,
				limit: DEFAULT_PAGE_SIZE,
				status,
				category: DEFAULT_CATEGORY,
				search,
			}),
		[page, status, search]
	);

	const { data, isLoading, isError, error } =
		api.Support.GetList.useQuery(queryParams);

	const { mutate: markClosed } = api.Support.UpdateStatus.useMutation();

	const tickets: SupportTicketType[] = Array.isArray(data)
		? data
		: ((data as TicketListData | undefined)?.tickets ??
				(data as { data?: SupportTicketType[] } | undefined)?.data ??
				[]);

	const totalCount: number =
		(data as { meta?: { total?: number } } | undefined)?.meta?.total ??
		(data as TicketListData | undefined)?.total ??
		tickets.length;

	const handleViewTicket = (id: string) => {
		setSelectedTicketId(id);
		setDialogOpen(true);
	};

	const handleMarkClosed = (id: string) => {
		markClosed({ id, status: TicketStatus.CLOSED });
	};

	const handleDialogOpenChange = (open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			setSelectedTicketId(null);
		}
	};

	const handleMetricClick = (filter: StatusFilter) => {
		setStatus(filter);
		setPage(1);
	};

	return (
		<div className="w-full space-y-5 bg-background p-6">
			<PageHeader
				category="SUPPORT MANAGEMENT"
				title="Support Inbox"
				description="Review, manage, and respond to customer inquiries."
			/>

			<SupportMetrics
				tickets={tickets}
				activeStatus={status}
				onMetricClick={handleMetricClick}
			/>

			{isError ? (
				<div className="rounded-xl border-0 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-xs">
					{(error as { response?: { data?: { message?: string } } })?.response
						?.data?.message || "Failed to load support tickets."}
				</div>
			) : null}

			<div className="rounded-xl border-0 bg-card p-6 shadow-xs">
				<SupportFilterBar
					search={search}
					onSearchChange={(value) => {
						setSearch(value);
						setPage(1);
					}}
					status={status}
					onStatusChange={(value) => {
						setStatus(value);
						setPage(1);
					}}
				/>

				<SupportTable
					tickets={tickets}
					loading={isLoading}
					page={page}
					totalItems={totalCount}
					pageSize={DEFAULT_PAGE_SIZE}
					onPageChange={setPage}
					onViewTicket={handleViewTicket}
					onMarkClosed={handleMarkClosed}
				/>
			</div>

			<TicketDetailDialog
				ticketId={selectedTicketId}
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
			/>
		</div>
	);
}
