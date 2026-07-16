import { ErrorRes, SuccessRes } from "@/types/core";
import type {
	AgarMentorWaitlistApplication,
	AgarMentorWaitlistDashboardStats,
	GetAgarMentorWaitlistResponse,
} from "@/types/agar-mentor-waitlist";
import {
	UseMutationOptions,
	UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export async function getAgarMentorWaitlistFn(): Promise<GetAgarMentorWaitlistResponse> {
	const response = await axios.get(`/api/agar-mentor-waitlist`);
	return response.data?.data ?? response.data;
}

export async function getAgarMentorWaitlistByIdFn(
	id: string,
): Promise<AgarMentorWaitlistApplication> {
	const response = await axios.get(`/api/agar-mentor-waitlist/${id}`);
	return response.data?.data ?? response.data;
}

export async function getAgarMentorWaitlistDashboardStatsFn(): Promise<AgarMentorWaitlistDashboardStats> {
	const response = await axios.get(`/api/agar-mentor-waitlist/dashboard-stats`);
	return response.data?.data ?? response.data;
}

export async function deleteAgarMentorWaitlistByIdFn(id: string): Promise<SuccessRes> {
	const response = await axios.delete(`/api/agar-mentor-waitlist/${id}`);
	return response.data?.data ?? response.data;
}

const AgarMentorWaitlistApi = {
	getWaitlist: {
		useQuery: (
			options?: UseQueryOptions<GetAgarMentorWaitlistResponse, AxiosError<ErrorRes>>,
		) =>
			useQuery({
				queryKey: ["AgarMentorWaitlist"],
				queryFn: getAgarMentorWaitlistFn,
				...options,
			}),
	},
	getDashboardStats: {
		useQuery: (
			options?: UseQueryOptions<AgarMentorWaitlistDashboardStats, AxiosError<ErrorRes>>,
		) =>
			useQuery({
				queryKey: ["AgarMentorWaitlist", "dashboard-stats"],
				queryFn: getAgarMentorWaitlistDashboardStatsFn,
				...options,
			}),
	},
	getById: {
		useQuery: (
			id: string,
			options?: Omit<
				UseQueryOptions<AgarMentorWaitlistApplication, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>,
		) =>
			useQuery({
				queryKey: ["AgarMentorWaitlist", id],
				queryFn: () => getAgarMentorWaitlistByIdFn(id),
				enabled: Boolean(id),
				...options,
			}),
	},
	delete: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>,
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deleteAgarMentorWaitlistByIdFn,
				...options,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Application deleted successfully");

					queryClient.setQueryData<GetAgarMentorWaitlistResponse>(
						["AgarMentorWaitlist"],
						(current) => current?.filter((item) => item._id !== id) ?? [],
					);
					queryClient.removeQueries({ queryKey: ["AgarMentorWaitlist", id] });

					options?.onSuccess?.(res, id, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err?.response?.data?.message || "Something went wrong");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
			});
		},
	},
};

export default AgarMentorWaitlistApi;
