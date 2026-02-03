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

export interface SocialType {
	_id?: string;
	name: string;
	link: string;
}

export interface SMEProfileFormType {
	businessName: string;
	dateOfRegistration: string;
	industry: string;
	bphoneNumber: string;
	email: string;
	website: string;
	legalFormat: string;
	staffSize: string;
	revenueRange: string;
	address: string;
	description: string;
	categories: string[];
	socialNetwork: SocialType[];
	companyProfile: FileType;
	businessLicense: FileType;
	
	bussinessLicense?: FileType;
	attachment: FileType[];
	gallery: FileType[];
	avatar: FileType;
}

export interface SMEProfileType extends SMEProfileFormType {
	_id: string;
	smeId: {
		_id: string;
		firstName?: string;
		lastName?: string;
	};
	name: string;
	status: string;
	updateStatus?: "PENDING" | "NONE" | "" | " ";
	approvedAt?: string;
}

export async function createSmeProfileFn(data: SMEProfileFormType) {
	return (await axios.post(`${API_URL}/api/sme-profile/create`, data)).data;
}

export async function getMySmeProfileFn() {
	return (await axios.get(`${API_URL}/api/sme-profile/my-profile`)).data;
}

export async function getSmeProfilesFn() {
	return (await axios.get(`${API_URL}/api/sme-profile/get`)).data;
}

export async function getSmeProfileByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/sme-profile/show/${id}`)).data;
}

export async function approveSmeProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/sme-profile/approve/${id}`)).data;
}

export async function rejectSmeProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/sme-profile/reject/${id}`)).data;
}

export async function approveSmeProfileUpdateFn(id: string) {
	return (await axios.post(`${API_URL}/api/sme-profile/approve-update/${id}`)).data;
}

export async function rejectSmeProfileUpdateFn(id: string) {
	return (await axios.post(`${API_URL}/api/sme-profile/reject-update/${id}`)).data;
}

const SmeProfileApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, SMEProfileFormType>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createSmeProfileFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["sme-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["sme-profile", "my"] });
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
		useQuery: (options?: UseQueryOptions<SMEProfileType, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["sme-profile", "my"],
				queryFn: getMySmeProfileFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (options?: UseQueryOptions<SMEProfileType[], AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["sme-profiles"],
				queryFn: getSmeProfilesFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<SMEProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["sme-profiles", id],
				queryFn: () => getSmeProfileByIdFn(id),
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
				mutationFn: approveSmeProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					queryClient.invalidateQueries({ queryKey: ["sme-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["sme-profiles", id] });
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
				mutationFn: rejectSmeProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					queryClient.invalidateQueries({ queryKey: ["sme-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["sme-profiles", id] });
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

	UpdateApprove: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: approveSmeProfileUpdateFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Update approved");
					queryClient.invalidateQueries({ queryKey: ["sme-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["sme-profiles", id] });
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

	UpdateReject: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: rejectSmeProfileUpdateFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Update rejected");
					queryClient.invalidateQueries({ queryKey: ["sme-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["sme-profiles", id] });
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

export default SmeProfileApi;

