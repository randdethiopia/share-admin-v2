import { ErrorRes } from "@/types/core";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface PendingUpdatesCountResponse {
	count: number;
}

export const pendingUpdatesCountKey = ["adminPendingUpdatesCount"] as const;

export function formatPendingUpdatesCount(count: number): string {
	return count > 99 ? "99+" : String(count);
}

export async function fetchPendingUpdatesCountFn(): Promise<PendingUpdatesCountResponse> {
	const { data } = await axios.get<PendingUpdatesCountResponse>(
		`${API_URL}/api/admin/profile-update-requests/count`
	);
	return data;
}

export function useAdminPendingUpdatesCount(
	options?: Omit<
		UseQueryOptions<PendingUpdatesCountResponse, AxiosError<ErrorRes>>,
		"queryKey" | "queryFn"
	>
) {
	return useQuery({
		queryKey: pendingUpdatesCountKey,
		queryFn: fetchPendingUpdatesCountFn,
		refetchInterval: 20_000,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		staleTime: 10_000,
		...options,
	});
}
