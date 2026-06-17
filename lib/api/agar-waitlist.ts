import { ErrorRes } from "@/types/core";
import type {
	AgarWaitlistApplication,
	GetAgarWaitlistResponse,
} from "@/types/agar-waitlist";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export async function getAgarWaitlistFn(): Promise<GetAgarWaitlistResponse> {
	const response = await axios.get(`/api/agar-waitlist`);
	return response.data?.data ?? response.data;
}

export async function getAgarWaitlistByIdFn(id: string): Promise<AgarWaitlistApplication> {
	const response = await axios.get(`/api/agar-waitlist/${id}`);
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
};

export default AgarWaitlistApi;
