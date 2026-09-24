import { ErrorRes } from "@/types/core";
import { UseQueryOptions, keepPreviousData, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "@/lib/axios";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type LoginLogUserType = "ADMIN" | "TRAINEE";

export type LoginFailureReason =
	| "USER_NOT_FOUND"
	| "NOT_ACTIVATED"
	| "TERMINATED"
	| "INVALID_PASSWORD"
	| "MOODLE_UNAVAILABLE";

export type LoginLogUser = {
	_id: string;
	// admin
	firstName?: string;
	lastName?: string;
	// trainee
	firstname?: string;
	lastname?: string;
	email?: string;
	phoneNumber?: string;
};

export type LoginLogType = {
	_id: string;
	userType: LoginLogUserType;
	userId: LoginLogUser | null;
	identifier: string;
	success: boolean;
	reason?: LoginFailureReason | string;
	ip?: string;
	userAgent?: string;
	timestamp: string;
};

export type LoginLogSummary = {
	total: number;
	successful: number;
	failed: number;
	byUserType: Record<LoginLogUserType, { successful: number; failed: number }>;
};

export type LoginLogPagination = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

export type LoginLogListResponse = {
	success: true;
	data: LoginLogType[];
	summary: LoginLogSummary;
	pagination: LoginLogPagination;
};

export type LoginLogQueryParams = {
	userType?: LoginLogUserType;
	from?: string;
	to?: string;
	success?: "true" | "false";
	reason?: LoginFailureReason;
	userId?: string;
	identifier?: string;
	page?: number;
	limit?: number;
};

export const loginLogKeys = {
	all: ["login-logs"] as const,
	list: (params?: LoginLogQueryParams) =>
		[...loginLogKeys.all, "list", params] as const,
};

export async function getLoginLogsFn(params?: LoginLogQueryParams) {
	return (
		await axios.get<LoginLogListResponse>(`${API_URL}/api/admin/login-logs`, {
			params,
		})
	).data;
}

/** Admins use `firstName lastName`, trainees `firstname lastname`; fall back to the login identifier. */
export function getLoginLogDisplayName(log: LoginLogType) {
	const user = log.userId;
	if (!user) return log.identifier;

	const name = [user.firstName ?? user.firstname, user.lastName ?? user.lastname]
		.filter(Boolean)
		.join(" ")
		.trim();

	return name || log.identifier;
}

const LoginLogApi = {
	GetList: {
		useQuery: (
			params?: LoginLogQueryParams,
			options?: Omit<
				UseQueryOptions<LoginLogListResponse, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: loginLogKeys.list(params),
				queryFn: () => getLoginLogsFn(params),
				placeholderData: keepPreviousData,
				...options,
			}),
	},
};

export default LoginLogApi;
