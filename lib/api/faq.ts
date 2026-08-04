import { ErrorRes, SuccessRes } from "@/types/core";
import {
	type QueryClient,
	UseMutationOptions,
	UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "@/lib/axios";
import { toast } from "sonner";

import { faqKeys } from "./faq.keys";
import type {
	CreateFAQInput,
	FAQListResponse,
	FAQType,
	UpdateFAQInput,
} from "./faq.types";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

function normalizeFaqList(res: FAQListResponse): FAQType[] {
	const payload = res.data;
	if (Array.isArray(payload)) return payload;
	return payload?.data ?? [];
}

export async function getFaqsFn() {
	return (await axios.get<FAQListResponse>(`${API_URL}/api/faq`)).data;
}

export async function createFaqFn(input: CreateFAQInput) {
	return (await axios.post<SuccessRes>(`${API_URL}/api/faq`, input)).data;
}

export async function updateFaqFn({ id, ...data }: UpdateFAQInput) {
	return (
		await axios.patch<SuccessRes>(`${API_URL}/api/faq/${id}`, data)
	).data;
}

export async function deleteFaqFn(id: string) {
	return (await axios.delete<SuccessRes>(`${API_URL}/api/faq/${id}`)).data;
}

async function invalidateAndRefetchFaqs(queryClient: QueryClient) {
	await queryClient.invalidateQueries({ queryKey: ["faq"] });
	await queryClient.invalidateQueries({ queryKey: faqKeys.all });
	await queryClient.refetchQueries({ queryKey: ["faq"] });
}

const FaqApi = {
	GetList: {
		useQuery: (
			options?: Omit<
				UseQueryOptions<FAQListResponse, AxiosError<ErrorRes>, FAQType[]>,
				"queryKey" | "queryFn" | "select"
			>
		) =>
			useQuery({
				queryKey: faqKeys.list(),
				queryFn: getFaqsFn,
				select: (res) => normalizeFaqList(res),
				...options,
			}),
	},

	Create: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				CreateFAQInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				...options,
				mutationFn: createFaqFn,
				onSuccess: async (data, variables, context) => {
					await invalidateAndRefetchFaqs(queryClient);
					toast.success("Question added to Question Bank!");
					options?.onSuccess?.(data, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
			});
		},
	},

	Update: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				UpdateFAQInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				...options,
				mutationFn: updateFaqFn,
				onSuccess: async (data, variables, context) => {
					await invalidateAndRefetchFaqs(queryClient);
					toast.success("Question Bank entry updated.");
					options?.onSuccess?.(data, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
			});
		},
	},

	Delete: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				...options,
				mutationFn: deleteFaqFn,
				onSuccess: async (data, variables, context) => {
					await invalidateAndRefetchFaqs(queryClient);
					toast.success("Question removed from Question Bank.");
					options?.onSuccess?.(data, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
			});
		},
	},
};

export default FaqApi;
