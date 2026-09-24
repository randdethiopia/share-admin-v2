import { format } from "date-fns";

import type {
	LoginFailureReason,
	LoginLogQueryParams,
	LoginLogUserType,
} from "@/lib/api/login-log";

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const; // backend max is 100
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];
export const SEARCH_DEBOUNCE_MS = 400;

export const LOG_COLUMNS = ["User", "Type", "Status", "Reason", "IP address", "Device", "Time"];

export const REASON_OPTIONS: LoginFailureReason[] = [
	"USER_NOT_FOUND",
	"NOT_ACTIVATED",
	"TERMINATED",
	"INVALID_PASSWORD",
	"MOODLE_UNAVAILABLE",
];

export type UserTypeFilter = "ALL" | LoginLogUserType;

export type ResultFilter = "ALL" | "SUCCESS" | "FAILED" | LoginFailureReason;

export type LoginLogFilters = {
	search: string;
	userType: UserTypeFilter;
	result: ResultFilter;
	from: string;
	to: string;
};

export const DEFAULT_FILTERS: LoginLogFilters = {
	search: "",
	userType: "ALL",
	result: "ALL",
	from: "",
	to: "",
};

export function hasActiveFilters(filters: LoginLogFilters) {
	return (
		filters.userType !== "ALL" ||
		filters.result !== "ALL" ||
		Boolean(filters.search || filters.from || filters.to)
	);
}

/** `identifier` is passed separately so the search box can be debounced. */
export function buildLoginLogQueryParams({
	filters,
	identifier,
	page,
	limit,
}: {
	filters: LoginLogFilters;
	identifier: string;
	page: number;
	limit: number;
}): LoginLogQueryParams {
	return {
		page,
		limit,
		userType: filters.userType === "ALL" ? undefined : filters.userType,
		...resultToParams(filters.result),
		identifier: identifier || undefined,
		from: filters.from || undefined,
		to: filters.to || undefined,
	};
}

function resultToParams(result: ResultFilter): Pick<LoginLogQueryParams, "success" | "reason"> {
	if (result === "ALL") return {};
	if (result === "SUCCESS") return { success: "true" };
	if (result === "FAILED") return { success: "false" };
	return { success: "false", reason: result };
}

export function formatEnumLabel(value: string) {
	return value
		.split("_")
		.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
		.join(" ");
}

/** Short "Browser on OS" label; falls back to the raw user agent. */
export function describeUserAgent(userAgent?: string) {
	if (!userAgent) return "—";

	const browser =
		(/Edg\//.test(userAgent) && "Edge") ||
		(/OPR\//.test(userAgent) && "Opera") ||
		(/Firefox\//.test(userAgent) && "Firefox") ||
		(/Chrome\//.test(userAgent) && "Chrome") ||
		(/Safari\//.test(userAgent) && "Safari") ||
		null;

	const os =
		(/Windows/.test(userAgent) && "Windows") ||
		(/Android/.test(userAgent) && "Android") ||
		(/iPhone|iPad|iPod/.test(userAgent) && "iOS") ||
		(/Mac OS X/.test(userAgent) && "macOS") ||
		(/Linux/.test(userAgent) && "Linux") ||
		null;

	if (!browser && !os) return userAgent;
	return [browser, os].filter(Boolean).join(" on ");
}

export function formatTimestamp(timestamp: string) {
	const date = new Date(timestamp);
	return Number.isNaN(date.getTime()) ? timestamp : format(date, "MMM d, yyyy HH:mm:ss");
}
