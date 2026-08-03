import type { GetTicketsQueryParams } from "@/lib/api/support.types";
import {
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

export function formatCategoryLabel(category: TicketCategory) {
	return CATEGORY_LABELS[category] ?? category;
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
