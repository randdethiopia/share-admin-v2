import type { GetTicketsQueryParams, SupportTicketType } from "@/lib/api/support.types";
import {
	EmailStatus,
	TicketCategory,
	TicketStatus,
} from "@/lib/api/support.types";

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_STATUS = "ALL";
export const DEFAULT_CATEGORY = "ALL";

export const STATUS_FILTER_OPTIONS = [
	"ALL",
	"NEW",
	"OPEN",
	"ANSWERED",
	"CLOSED",
	"ARCHIVED",
] as const;

export const CATEGORY_FILTER_OPTIONS = [
	"ALL",
	"GENERAL",
	"BUG",
	"FEATURE_REQUEST",
	"BUSINESS",
	"EXPERT",
	"MENTOR",
	"OTHER",
] as const;

export type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];
export type CategoryFilter = (typeof CATEGORY_FILTER_OPTIONS)[number];

const CATEGORY_LABELS: Record<TicketCategory, string> = {
	[TicketCategory.GENERAL]: "General",
	[TicketCategory.BUG]: "Bug",
	[TicketCategory.FEATURE_REQUEST]: "Feature Request",
	[TicketCategory.BUSINESS]: "Business",
	[TicketCategory.EXPERT]: "Expert",
	[TicketCategory.MENTOR]: "Mentor",
	[TicketCategory.OTHER]: "Other",
};

export function formatTicketNumber(id: string) {
	const suffix = id.slice(-6).toUpperCase().padStart(6, "0");
	return `TK-${suffix}`;
}

export function formatTicketDate(iso: string) {
	const parsed = new Date(iso);
	if (Number.isNaN(parsed.getTime())) return "-";
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(parsed);
}

export function formatRelativeTime(dateString: string) {
	const parsed = new Date(dateString);
	if (Number.isNaN(parsed.getTime())) {
		return { label: "-", title: "" };
	}

	const title = formatTicketDate(dateString);
	const diffMs = Date.now() - parsed.getTime();
	const diffMinutes = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffMinutes < 1) return { label: "just now", title };
	if (diffMinutes < 60) return { label: `${diffMinutes}m ago`, title };
	if (diffHours < 24) return { label: `${diffHours}h ago`, title };
	if (diffDays < 7) return { label: `${diffDays}d ago`, title };

	return { label: title, title };
}

export function getCustomerInitials(name?: string) {
	const trimmed = name?.trim();
	if (!trimmed) return "CU";

	return trimmed
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
}

export function formatCategoryLabel(category: TicketCategory) {
	return CATEGORY_LABELS[category] ?? category;
}

export function isAnsweredToday(ticket: SupportTicketType) {
	if (ticket.status !== TicketStatus.ANSWERED) return false;

	const reference = ticket.lastReplyAt ?? ticket.updatedAt;
	const parsed = new Date(reference);
	if (Number.isNaN(parsed.getTime())) return false;

	const now = new Date();
	return (
		parsed.getFullYear() === now.getFullYear() &&
		parsed.getMonth() === now.getMonth() &&
		parsed.getDate() === now.getDate()
	);
}

export function countFailedEmails(tickets: SupportTicketType[]) {
	return tickets.reduce((count, ticket) => {
		let ticketCount = ticket.emailStatus === EmailStatus.FAILED ? 1 : 0;

		if (ticket.replies?.length) {
			ticketCount += ticket.replies.filter(
				(reply) => reply.emailStatus === EmailStatus.FAILED
			).length;
		}

		return count + ticketCount;
	}, 0);
}

export function buildListQueryParams({
	page,
	limit = DEFAULT_PAGE_SIZE,
	status,
	category,
	search,
}: {
	page: number;
	limit?: number;
	status: StatusFilter;
	category: CategoryFilter;
	search: string;
}): GetTicketsQueryParams {
	const params: GetTicketsQueryParams = { page, limit };

	if (status !== "ALL") {
		params.status = status as TicketStatus;
	}

	if (category !== "ALL") {
		params.category = category as TicketCategory;
	}

	const trimmedSearch = search.trim();
	if (trimmedSearch) {
		params.search = trimmedSearch;
	}

	return params;
}
