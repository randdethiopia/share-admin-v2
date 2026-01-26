import { ErrorRes, FileType, SuccessRes } from "@/types/core";
import {
	UseMutationOptions,
	UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface InvestorProfileFormType {
	avatar: FileType;
	fullName: string;
	birthDate: string;
	gender: string;
	phoneNumber: string;
	email: string;
	country: string;
	jobType: string;
	netWorth: string;
	consentForm: string;
}

export interface InvestorProfileType extends InvestorProfileFormType {
	_id: string;
	investorId: string;
	status: string;
	approvedBy: string;
	approvedAt?: string | null;
	createdAt?: string;
}

// --- Worker functions ---
export async function createInvestorProfileFn(data: InvestorProfileFormType) {
	return (await axios.post(`${API_URL}/api/investor-profile/create`, data)).data;
}

export async function getMyInvestorProfileFn() {
	return (await axios.get(`${API_URL}/api/investor-profile/my-profile`)).data;
}

export async function getInvestorProfilesFn() {
	return (await axios.get(`${API_URL}/api/investor-profile/get`)).data;
}

export async function getInvestorProfileByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/investor-profile/show/${id}`)).data;
}

export async function approveInvestorProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/investor-profile/approve/${id}`)).data;
}

export async function rejectInvestorProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/investor-profile/reject/${id}`)).data;
}

const InvestorProfileApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				InvestorProfileFormType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createInvestorProfileFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["investor-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["investor-profile", "my"] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	GetMyProfile: {
		useQuery: (
			options?: UseQueryOptions<InvestorProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["investor-profile", "my"],
				queryFn: getMyInvestorProfileFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (
			options?: UseQueryOptions<InvestorProfileType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["investor-profiles"],
				queryFn: getInvestorProfilesFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<InvestorProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["investor-profiles", id],
				queryFn: () => getInvestorProfileByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	Approve: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: approveInvestorProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					queryClient.invalidateQueries({ queryKey: ["investor-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["investor-profiles", id] });
					options?.onSuccess?.(res, id, context, undefined as unknown as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Reject: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: rejectInvestorProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					queryClient.invalidateQueries({ queryKey: ["investor-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["investor-profiles", id] });
					options?.onSuccess?.(res, id, context, undefined as unknown as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},
};

export default InvestorProfileApi;

