import { ErrorRes, SuccessRes } from "@/types/core";
import type {
	AgarWaitlistApplication,
	GetAgarWaitlistResponse,
} from "@/types/agar-waitlist";
import { UseMutationOptions, UseQueryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

export async function getAgarWaitlistFn(): Promise<GetAgarWaitlistResponse> {
	const response = await axios.get(`/api/agar-waitlist`);
	return response.data?.data ?? response.data;
}

export async function getAgarWaitlistByIdFn(id: string): Promise<AgarWaitlistApplication> {
	const response = await axios.get(`/api/agar-waitlist/${id}`);
	return response.data?.data ?? response.data;
}

export async function deleteAgarWaitlistByIdFn(id: string): Promise<SuccessRes> {
	const response = await axios.delete(`/api/agar-waitlist/${id}`);
	return response.data?.data ?? response.data;
}

const AgarWaitlistApi = {
	getWaitlist: {
		useQuery: (
			options?: UseQueryOptions<GetAgarWaitlistResponse, AxiosError<ErrorRes>>,
		) =>
			useQuery({
				queryKey: ["AgarWaitlist"],
				queryFn: getAgarWaitlistFn,
				...options,
			}),
	},
	getById: {
		useQuery: (
			id: string,
			options?: Omit<
				UseQueryOptions<AgarWaitlistApplication, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>,
		) =>
			useQuery({
				queryKey: ["AgarWaitlist", id],
				queryFn: () => getAgarWaitlistByIdFn(id),
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
				mutationFn: deleteAgarWaitlistByIdFn,
				...options,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Application deleted successfully");

					queryClient.setQueryData<GetAgarWaitlistResponse>(
						["AgarWaitlist"],
						(current) => current?.filter((item) => item._id !== id) ?? [],
					);
					queryClient.removeQueries({ queryKey: ["AgarWaitlist", id] });

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

export default AgarWaitlistApi;
