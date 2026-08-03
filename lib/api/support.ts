import { ErrorRes, SuccessRes } from "@/types/core";
import {
	UseMutationOptions,
	UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "@/lib/axios";
import { toast } from "sonner";

import { SUPPORT_POLLING_INTERVAL } from "./support.constants";
import { supportKeys } from "./support.keys";
import { SupportMessages } from "./support.messages";
import type {
	GetTicketsQueryParams,
	ReplyTicketInput,
	TicketDetailData,
	TicketDetailResponse,
	TicketListData,
	TicketListResponse,
	UpdateTicketStatusInput,
} from "./support.types";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

function normalizeTicketList(
	res: TicketListResponse,
	params?: GetTicketsQueryParams
): TicketListData {
	const payload = res.data;

	if (Array.isArray(payload)) {
		return {
			tickets: payload,
			total: res.meta?.total ?? payload.length,
			page: res.meta?.page ?? params?.page ?? 1,
			limit: res.meta?.limit ?? params?.limit ?? 10,
		};
	}

	return {
		tickets: payload.tickets ?? [],
		total: payload.total ?? res.meta?.total ?? 0,
		page: payload.page ?? params?.page ?? 1,
		limit: payload.limit ?? params?.limit ?? 10,
	};
}

export async function getTicketsFn(params?: GetTicketsQueryParams) {
	return (
		await axios.get<TicketListResponse>(`${API_URL}/api/support/tickets`, {
			params,
		})
	).data;
}

export async function getTicketByIdFn(id: string) {
	return (
		await axios.get<TicketDetailResponse>(
			`${API_URL}/api/support/tickets/${id}`
		)
	).data;
}

export async function replyTicketFn({ id, message }: ReplyTicketInput) {
	return (
		await axios.post<SuccessRes>(
			`${API_URL}/api/support/tickets/${id}/replies`,
			{ message }
		)
	).data;
}

export async function updateStatusFn({ id, status }: UpdateTicketStatusInput) {
	return (
		await axios.patch<SuccessRes>(
			`${API_URL}/api/support/tickets/${id}/status`,
			{ status }
		)
	).data;
}

const SupportApi = {
	GetList: {
		useQuery: (
			params?: GetTicketsQueryParams,
			options?: Omit<
				UseQueryOptions<TicketListResponse, AxiosError<ErrorRes>, TicketListData>,
				"queryKey" | "queryFn" | "select"
			>
		) =>
			useQuery({
				queryKey: supportKeys.list(params),
				queryFn: () => getTicketsFn(params),
				refetchInterval: SUPPORT_POLLING_INTERVAL,
				refetchIntervalInBackground: false,
				refetchOnWindowFocus: true,
				select: (res) => normalizeTicketList(res, params),
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: Omit<
				UseQueryOptions<
					TicketDetailResponse,
					AxiosError<ErrorRes>,
					TicketDetailData
				>,
				"queryKey" | "queryFn" | "select"
			>
		) =>
			useQuery({
				queryKey: supportKeys.detail(id),
				queryFn: () => getTicketByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				select: (res) => res.data,
				...options,
			}),
	},

	Reply: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				ReplyTicketInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: replyTicketFn,
				onSuccess: (res, variables, context) => {
					toast.success(SupportMessages.replySuccess);
					queryClient.invalidateQueries({ queryKey: supportKeys.all });
					options?.onSuccess?.(res, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
				...options,
			});
		},
	},

	UpdateStatus: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				UpdateTicketStatusInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: updateStatusFn,
				onSuccess: (res, variables, context) => {
					toast.success(SupportMessages.statusUpdated);
					queryClient.invalidateQueries({ queryKey: supportKeys.all });
					options?.onSuccess?.(res, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
				...options,
			});
		},
	},
};

export default SupportApi;
