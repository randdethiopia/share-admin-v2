"use client";

import { Loader2 } from "lucide-react";

import { ReplyForm } from "@/components/support/reply-form";
import {
	formatTicketDate,
} from "@/components/support/support.constants";
import { EmailDeliveryBadge, StatusBadge } from "@/components/support/status-badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { TicketStatus } from "@/lib/api/support.types";

type TicketDetailDialogProps = {
	ticketId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function TicketDetailDialog({
	ticketId,
	open,
	onOpenChange,
}: TicketDetailDialogProps) {
	const {
		data,
		isLoading,
		isError,
		refetch,
	} = api.Support.GetById.useQuery(ticketId ?? "", {
		enabled: open && Boolean(ticketId),
	});

	const { mutate: updateStatus, isPending: isClosing } =
		api.Support.UpdateStatus.useMutation({
			onSuccess: () => {
				refetch();
			},
		});

	const ticket = data?.ticket;
	const replies = [...(data?.replies ?? [])].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
	);

	const isClosed =
		ticket?.status === TicketStatus.CLOSED ||
		ticket?.status === TicketStatus.ARCHIVED;

	const handleMarkClosed = () => {
		if (!ticketId || isClosed) return;
		updateStatus({ id: ticketId, status: TicketStatus.CLOSED });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-3xl space-y-6 overflow-y-auto rounded-xl border-0 bg-card p-6 shadow-lg">
				{isLoading ? (
					<div className="flex min-h-[240px] items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-agar-navy" />
					</div>
				) : isError || !ticket ? (
					<div className="space-y-4 py-8 text-center">
						<p className="text-sm text-destructive">
							Failed to load ticket details.
						</p>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Close
						</Button>
					</div>
				) : (
					<>
						<DialogHeader className="space-y-3 text-left">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div className="space-y-1">
									<DialogTitle className="text-xl font-bold text-[#1A4428]">
										{ticket.ticketNumber || ticket._id}
									</DialogTitle>
									<p className="text-sm font-semibold text-foreground">
										{ticket.name || "Customer"}
									</p>
									<p className="text-sm text-muted-foreground">
										{ticket.email || ticket.submitterEmail || "No email provided"}
									</p>
									<p className="text-xs text-muted-foreground">
										Created {formatTicketDate(ticket.createdAt)}
									</p>
								</div>
								<StatusBadge status={ticket.status} />
							</div>
						</DialogHeader>

						<div className="space-y-1 rounded-lg bg-[#F4F4F5] p-4">
							<p className="text-sm font-semibold text-agar-navy">
								{ticket.subject}
							</p>
							<p className="whitespace-pre-wrap text-sm text-foreground">
								{ticket.message}
							</p>
						</div>

						{replies.length > 0 ? (
							<div className="space-y-3">
								<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
									Reply Thread
								</p>
								{replies.map((reply) => (
									<div
										key={reply._id}
										className="rounded-lg border border-border/60 bg-background p-4"
									>
										<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
											<div>
												<p className="text-sm font-semibold">
													{reply.authorName ||
														(reply.isStaff ? "Support Team" : "Customer")}
												</p>
												<p className="text-xs text-muted-foreground">
													{formatTicketDate(reply.createdAt)}
												</p>
											</div>
											<EmailDeliveryBadge status={reply.emailStatus} />
										</div>
										<p className="whitespace-pre-wrap text-sm">{reply.message}</p>
									</div>
								))}
							</div>
						) : null}

						<div className="space-y-3">
							<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
								Admin Reply
							</p>
							{ticketId ? (
								<ReplyForm
									ticketId={ticketId}
									onSuccess={() => refetch()}
									disabled={isClosed}
								/>
							) : null}
						</div>

						{!isClosed ? (
							<div className="flex justify-end border-t border-border/60 pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={handleMarkClosed}
									disabled={isClosing}
									className="font-semibold"
								>
									{isClosing ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Mark as Closed
								</Button>
							</div>
						) : null}
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
