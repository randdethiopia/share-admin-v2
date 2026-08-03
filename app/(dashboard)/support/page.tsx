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
	type CategoryFilter,
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
	const [category, setCategory] = useState<CategoryFilter>(DEFAULT_CATEGORY);
	const [search, setSearch] = useState("");

	const queryParams = useMemo(
		() =>
			buildListQueryParams({
				page,
				limit: DEFAULT_PAGE_SIZE,
				status,
				category,
				search,
			}),
		[page, status, category, search]
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

	return (
		<div className="w-full space-y-6 bg-background p-6">
			<PageHeader
				category="SUPPORT MANAGEMENT"
				title="Support Tickets"
				description="Review, manage, and reply to customer inquiries."
			/>

			<SupportMetrics tickets={tickets} totalCount={totalCount} />

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
				category={category}
				onCategoryChange={(value) => {
					setCategory(value);
					setPage(1);
				}}
			/>

			{isError ? (
				<div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{(error as { response?: { data?: { message?: string } } })?.response
						?.data?.message || "Failed to load support tickets."}
				</div>
			) : null}

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

			<TicketDetailDialog
				ticketId={selectedTicketId}
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
			/>
		</div>
	);
}
