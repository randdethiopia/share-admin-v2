import type { SupportTicketType } from "@/lib/api/support.types";
import { TicketStatus } from "@/lib/api/support.types";
import {
	countFailedEmails,
	isAnsweredToday,
	type StatusFilter,
} from "@/components/support/support.constants";
import { cn } from "@/lib/utils";

type SupportMetricsProps = {
	tickets: SupportTicketType[];
	activeStatus?: StatusFilter;
	onMetricClick?: (filter: StatusFilter) => void;
};

const METRIC_ITEMS = [
	{
		key: "new",
		label: "NEW INQUIRIES",
		filter: "NEW" as StatusFilter,
		getValue: (tickets: SupportTicketType[]) =>
			tickets.filter((ticket) => ticket.status === TicketStatus.NEW).length,
	},
	{
		key: "open",
		label: "OPEN INQUIRIES",
		filter: "OPEN" as StatusFilter,
		getValue: (tickets: SupportTicketType[]) =>
			tickets.filter((ticket) => ticket.status === TicketStatus.OPEN).length,
	},
	{
		key: "answered-today",
		label: "ANSWERED TODAY",
		filter: "ANSWERED" as StatusFilter,
		getValue: (tickets: SupportTicketType[]) =>
			tickets.filter(isAnsweredToday).length,
	},
	{
		key: "failed-emails",
		label: "FAILED EMAILS",
		filter: null,
		getValue: (tickets: SupportTicketType[]) => countFailedEmails(tickets),
	},
] as const;

export function SupportMetrics({
	tickets,
	activeStatus = "ALL",
	onMetricClick,
}: SupportMetricsProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{METRIC_ITEMS.map((item) => {
				const isInteractive = Boolean(item.filter && onMetricClick);
				const isActive =
					item.filter !== null &&
					activeStatus !== "ALL" &&
					activeStatus === item.filter;

				return (
					<div
						key={item.key}
						className={cn(
							"h-[110px] rounded-xl border-0 bg-card p-5 shadow-xs transition-all hover:shadow-sm",
							isInteractive && "cursor-pointer",
							isActive && "ring-1 ring-primary/20"
						)}
						onClick={() => {
							if (item.filter && onMetricClick) {
								onMetricClick(item.filter);
							}
						}}
						onKeyDown={(event) => {
							if (!item.filter || !onMetricClick) return;
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								onMetricClick(item.filter);
							}
						}}
						role={isInteractive ? "button" : undefined}
						tabIndex={isInteractive ? 0 : undefined}
					>
						<p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
							{item.label}
						</p>
						<p className="text-3xl font-extrabold text-[#1A4428]">
							{item.getValue(tickets)}
						</p>
					</div>
				);
			})}
		</div>
	);
}
