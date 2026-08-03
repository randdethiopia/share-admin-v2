import type { SupportTicketType } from "@/lib/api/support.types";
import { TicketStatus } from "@/lib/api/support.types";

type SupportMetricsProps = {
	tickets: SupportTicketType[];
	totalCount: number;
};

const METRIC_ITEMS = [
	{ key: "new", label: "NEW TICKETS", getValue: (tickets: SupportTicketType[]) => tickets.filter((t) => t.status === TicketStatus.NEW).length },
	{ key: "open", label: "OPEN TICKETS", getValue: (tickets: SupportTicketType[]) => tickets.filter((t) => t.status === TicketStatus.OPEN).length },
	{ key: "answered", label: "ANSWERED TICKETS", getValue: (tickets: SupportTicketType[]) => tickets.filter((t) => t.status === TicketStatus.ANSWERED).length },
] as const;

export function SupportMetrics({ tickets, totalCount }: SupportMetricsProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{METRIC_ITEMS.map((item) => (
				<div
					key={item.key}
					className="rounded-xl border-0 bg-card p-4 shadow-xs"
				>
					<p className="text-[11px] font-bold tracking-wider text-muted-foreground">
						{item.label}
					</p>
					<p className="mt-2 text-3xl font-bold text-agar-navy">
						{item.getValue(tickets)}
					</p>
				</div>
			))}
			<div className="rounded-xl border-0 bg-card p-4 shadow-xs">
				<p className="text-[11px] font-bold tracking-wider text-muted-foreground">
					TOTAL TICKETS
				</p>
				<p className="mt-2 text-3xl font-bold text-agar-navy">{totalCount}</p>
			</div>
		</div>
	);
}
