import {
	EmailStatus,
	TicketCategory,
	TicketStatus,
} from "@/lib/api/support.types";
import { formatCategoryLabel } from "@/components/support/support.constants";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<TicketStatus, string> = {
	[TicketStatus.NEW]: "bg-amber-50 text-amber-700",
	[TicketStatus.OPEN]: "bg-blue-50 text-blue-700",
	[TicketStatus.ANSWERED]: "bg-emerald-50 text-emerald-700",
	[TicketStatus.CLOSED]: "bg-slate-100 text-slate-600",
	[TicketStatus.ARCHIVED]: "bg-gray-100 text-gray-500",
};

type StatusBadgeProps = {
	status: TicketStatus;
	className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
				STATUS_STYLES[status],
				className
			)}
		>
			● {status}
		</span>
	);
}

type CategoryBadgeProps = {
	category: TicketCategory;
	className?: string;
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
				className
			)}
		>
			{formatCategoryLabel(category)}
		</span>
	);
}

const EMAIL_STYLES: Record<EmailStatus, string> = {
	[EmailStatus.SENT]: "bg-emerald-50 text-emerald-700",
	[EmailStatus.FAILED]: "bg-red-50 text-red-700",
	[EmailStatus.PENDING]: "bg-amber-50 text-amber-700",
};

type EmailDeliveryBadgeProps = {
	status: EmailStatus;
	className?: string;
};

export function EmailDeliveryBadge({ status, className }: EmailDeliveryBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
				EMAIL_STYLES[status],
				className
			)}
		>
			● {status}
		</span>
	);
}
