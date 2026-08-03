"use client";

import { Loader2 } from "lucide-react";

import { ReplyForm } from "@/components/support/reply-form";
import {
	formatRelativeTime,
	getCustomerInitials,
} from "@/components/support/support.constants";
import {
	CategoryBadge,
	EmailDeliveryBadge,
	StatusBadge,
} from "@/components/support/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

	const customerName = ticket?.name || ticket?.submitterName || "Customer";
	const customerEmail =
		ticket?.email || ticket?.submitterEmail || "No email provided";
	const createdRelative = ticket
		? formatRelativeTime(ticket.createdAt)
		: { label: "-", title: "" };
	const updatedRelative = ticket
		? formatRelativeTime(ticket.updatedAt)
		: { label: "-", title: "" };

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-3xl space-y-6 overflow-y-auto rounded-2xl border-0 bg-card p-6 shadow-lg">
				{isLoading ? (
					<div className="flex min-h-[240px] items-center justify-center p-6">
						<Loader2 className="h-8 w-8 animate-spin text-agar-navy" />
					</div>
				) : isError || !ticket ? (
					<div className="space-y-4 p-6 py-8 text-center">
						<p className="text-sm text-destructive">
							Failed to load ticket details.
						</p>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Close
						</Button>
					</div>
				) : (
					<>
						<div className="space-y-6">
							<DialogHeader className="space-y-4 text-left">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div className="space-y-2">
										<DialogTitle className="text-xl font-bold text-[#1A4428]">
											Support Inquiry - {ticket.ticketNumber || ticket._id}
										</DialogTitle>
										<div className="flex flex-wrap items-center gap-2">
											<StatusBadge status={ticket.status} />
										</div>
										<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
											<span title={createdRelative.title}>
												Created {createdRelative.label}
											</span>
											<span title={updatedRelative.title}>
												Updated {updatedRelative.label}
											</span>
										</div>
									</div>
								</div>
							</DialogHeader>

							<div className="flex items-start gap-4 rounded-xl border border-border/40 bg-background p-4">
								<Avatar className="h-11 w-11">
									<AvatarFallback className="bg-agar-navy text-sm font-semibold text-white">
										{getCustomerInitials(customerName)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 space-y-1">
									<p className="text-sm font-semibold text-foreground">
										{customerName}
									</p>
									<p className="text-sm text-muted-foreground">
										{customerEmail}
									</p>
									<CategoryBadge category={ticket.category} />
								</div>
							</div>

							<div className="space-y-2 rounded-xl border-0 bg-[#F4F4F5] p-5">
								<p className="text-sm font-semibold text-agar-navy">
									{ticket.subject}
								</p>
								<p className="whitespace-pre-wrap text-sm text-foreground">
									{ticket.message}
								</p>
							</div>

							{replies.length > 0 ? (
								<div className="space-y-4">
									<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
										Conversation
									</p>
									<div className="space-y-4 border-l-2 border-border/60 pl-4">
										{replies.map((reply) => {
											const authorName =
												reply.authorName ||
												(reply.isStaff ? "Support Team" : "Customer");
											const replyRelative = formatRelativeTime(reply.createdAt);

											return (
												<div
													key={reply._id}
													className="rounded-xl border border-border/60 bg-background p-4"
												>
													<div className="mb-3 flex flex-wrap items-start justify-between gap-2">
														<div className="flex items-start gap-3">
															{reply.isStaff ? (
																<Avatar className="h-8 w-8">
																	<AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
																		{getCustomerInitials(authorName)}
																	</AvatarFallback>
																</Avatar>
															) : null}
															<div>
																<p className="text-sm font-semibold">
																	{authorName}
																</p>
																<p
																	className="text-xs text-muted-foreground"
																	title={replyRelative.title}
																>
																	{replyRelative.label}
																</p>
															</div>
														</div>
														<EmailDeliveryBadge status={reply.emailStatus} />
													</div>
													<p className="whitespace-pre-wrap text-sm">
														{reply.message}
													</p>
												</div>
											);
										})}
									</div>
								</div>
							) : null}
						</div>

						<div className="border-t bg-card pt-4">
							<p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
								Admin Reply
							</p>
							{ticketId ? (
								<ReplyForm
									ticketId={ticketId}
									onSuccess={() => refetch()}
									disabled={isClosed}
									showMarkClosed={!isClosed}
									onMarkClosed={handleMarkClosed}
									isClosing={isClosing}
								/>
							) : null}
						</div>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
