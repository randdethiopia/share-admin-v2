import { ErrorRes, SuccessRes } from "@/types/core";
import {
	UseMutationOptions,
	UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { type InvestorProfileType } from "@/api/mentor";
import { type SMEProfileType } from "@/api/Buisness";
import { type ProjectType } from "@/api/project";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface InvestmentFormType {
	projectId: string;
	amount: number;
	smeId: string;
}

export interface InvestmentType extends InvestmentFormType {
	_id: string;
	investorId: string;
	investor: InvestorProfileType;
	sme: SMEProfileType;
	project: ProjectType;
	createdAt: string | Date;
	approvedAt?: string | null;
	approvedBy?: string;
	status: string;
	paymentStatus: string;
	returnedDate?: string | null;
	returnedBy?: string | null;
	dueDate?: string | null;
	txRef?: string;
	chapaStatus?: string;
}

export interface BankType {
	_id: string;
	balance: number;
	ownerId: string;
	role: string;
	fullName: string;
}

export interface CreateInvestmentResType extends SuccessRes {
	paymentUrl: string;
}

export interface ApproveInvestmentReqType {
	projectId: string;
	dueDate: string;
}

// --- Worker functions ---
export async function createInvestmentFn(data: InvestmentFormType) {
	return (await axios.post(`${API_URL}/api/investment/create`, data)).data;
}

export async function getInvestmentsFn() {
	return (await axios.get(`${API_URL}/api/investment/get/`)).data;
}

export async function getInvestmentBankFn() {
	return (await axios.get(`${API_URL}/api/investment/bank/get/`)).data;
}

export async function getMyInvestmentsFn() {
	return (await axios.get(`${API_URL}/api/investment/my-investments`)).data;
}

export async function getInvestmentByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/investment/show/${id}`)).data;
}

export async function getInvestmentByProjectIdFn(projectId: string) {
	return (await axios.get(`${API_URL}/api/investment/byproject/${projectId}`)).data;
}

export async function approveInvestmentFn(projectId: string, data: { dueDate: string }) {
	return (await axios.post(`${API_URL}/api/investment/approve/${projectId}`, data)).data;
}

export async function returnInvestmentFn(id: string) {
	return (await axios.post(`${API_URL}/api/investment/return/${id}`)).data;
}

export async function reinvestInvestmentFn(data: unknown) {
	return (await axios.post(`${API_URL}/api/investment/reinvest/`, data)).data;
}

export async function deleteInvestmentFn(id: string) {
	return (await axios.delete(`${API_URL}/api/investment/delete/${id}`)).data;
}

function goToPaymentUrl(router: ReturnType<typeof useRouter>, paymentUrl?: string) {
	if (!paymentUrl) return;
	if (typeof window === "undefined") return;

	// If it looks like an external URL (e.g., Chapa), do a hard redirect.
	if (/^https?:\/\//i.test(paymentUrl)) {
		window.location.assign(paymentUrl);
		return;
	}

	router.push(paymentUrl);
}

const InvestmentApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				CreateInvestmentResType,
				AxiosError<ErrorRes>,
				InvestmentFormType
			>
		) => {
			const queryClient = useQueryClient();
			const router = useRouter();

			return useMutation({
				mutationFn: createInvestmentFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["Investments"] });
					queryClient.invalidateQueries({ queryKey: ["Investments", "my"] });
					goToPaymentUrl(router, res.paymentUrl);
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

	Approve: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				ApproveInvestmentReqType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: ({ projectId, dueDate }) =>
					approveInvestmentFn(projectId, { dueDate }),
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Approved");
					queryClient.invalidateQueries({ queryKey: ["Investments"] });
					queryClient.invalidateQueries({ queryKey: ["Investments", "my"] });
					queryClient.invalidateQueries({
						queryKey: ["Investments", "project", variables.projectId],
					});
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

	ReInvest: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, unknown>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: reinvestInvestmentFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Reinvested");
					queryClient.invalidateQueries({ queryKey: ["Investments"] });
					queryClient.invalidateQueries({ queryKey: ["Investments", "my"] });
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

	Return: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: returnInvestmentFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Returned");
					queryClient.invalidateQueries({ queryKey: ["Investments"] });
					queryClient.invalidateQueries({ queryKey: ["Investments", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Investments", id] });
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

	Delete: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deleteInvestmentFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Deleted");
					queryClient.invalidateQueries({ queryKey: ["Investments"] });
					queryClient.invalidateQueries({ queryKey: ["Investments", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Investments", id] });
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

	GetBank: {
		useQuery: (options?: UseQueryOptions<BankType[], AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["Investments", "bank"],
				queryFn: getInvestmentBankFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (
			options?: UseQueryOptions<InvestmentType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["Investments"],
				queryFn: getInvestmentsFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<InvestmentType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["Investments", id],
				queryFn: () => getInvestmentByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	GetMyList: {
		useQuery: (
			options?: UseQueryOptions<InvestmentType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["Investments", "my"],
				queryFn: getMyInvestmentsFn,
				...options,
			}),
	},

	GetByProjectId: {
		useQuery: (
			projectId: string,
			options?: UseQueryOptions<InvestmentType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["Investments", "project", projectId],
				queryFn: () => getInvestmentByProjectIdFn(projectId),
				enabled: Boolean(projectId) && (options?.enabled ?? true),
				...options,
			}),
	},
};

export default InvestmentApi;

