import { ErrorRes } from "@/types/core";
import {
	UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type ProfileStatusKey = "APPROVED" | "PENDING" | "REJECTED" | "DRAFT";

export interface StatusCount {
	status: ProfileStatusKey;
	count: number;
}

export interface CountBucket {
	_id: string;
	count: number;
}

export interface AdminDashboardStats {
	meta: {
		year: number | "all";
	};
	totals: {
		sme: number;
		advisor: number;
		investor: number;
		total: number;
	};
	statusDistribution: {
		sme: StatusCount[];
		advisor: StatusCount[];
		investor: StatusCount[];
	};
	monthlyTrends: Array<{
		month: number;
		label: string;
		sme: number;
		advisor: number;
		investor: number;
		total: number;
	}>;
	industrySectors: {
		smeIndustries: CountBucket[];
		advisorCategories: CountBucket[];
	};
	completionRates: {
		sme: { average: number; buckets: CountBucket[] };
		advisor: { average: number; buckets: CountBucket[] };
		investor: { average: number; buckets: CountBucket[] };
	};
	sizeDistribution: {
		advisors: CountBucket[];
		smes: CountBucket[];
	};
}

interface AdminDashboardStatsResponse {
	success: boolean;
	data: AdminDashboardStats;
}

export type { AdminDashboardStatsResponse };

export type DashboardYearParam = number | "all";

export async function getAdminDashboardStatsFn(year: DashboardYearParam) {
	const res = await axios.get<AdminDashboardStatsResponse>(
		`${API_URL}/api/admin/dashboard/stats`,
		{ params: { year } }
	);
	return res.data.data;
}

const AdminDashboardApi = {
	GetStats: {
		useQuery: (
			year: DashboardYearParam,
			options?: Omit<
				UseQueryOptions<AdminDashboardStats, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["AdminDashboard", "stats", year],
				queryFn: () => getAdminDashboardStatsFn(year),
				...options,
			}),
	},
};

export default AdminDashboardApi;
