import { ErrorRes, FileType, SuccessRes } from "@/types/core";
import {
	UseMutationOptions,
	UseQueryOptions,
	QueryClient,
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

export interface BusinessProfileFormType {
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
	attachment: FileType[];
	gallery: FileType[];
	avatar: FileType;
	// Backward-compatibility for earlier payloads
	bussinessLicense?: FileType;
}

export interface BusinessProfileType extends BusinessProfileFormType {
	_id: string;
	smeId: {
		_id: string;
		firstName: string;
		lastName: string;
	};
	name: string;
	status: string;
	updateStatus:
		| "PENDING"
		| "REQUEST_UPDATE"
		| "APPROVED"
		| "REJECTED"
		| "";
	approvedAt: string;
}

function getApprovedAt(res: unknown) {
	if (!res || typeof res !== "object") return undefined;
	const record = res as { approvedAt?: string | null; data?: { approvedAt?: string | null } };
	return record.data?.approvedAt ?? record.approvedAt ?? undefined;
}

function updateBusinessProfileCache(
	queryClient: QueryClient,
	id: string,
	updates: Partial<BusinessProfileType>
) {
	queryClient.setQueryData(
		["BusinessProfile"],
		(current?: BusinessProfileType[]) =>
			Array.isArray(current)
				? current.map((item) =>
						item._id === id ? { ...item, ...updates } : item
					)
				: current
	);

	queryClient.setQueryData(
		["BusinessProfile", id],
		(current?: BusinessProfileType) =>
			current ? { ...current, ...updates } : current
	);
}

// --- Worker functions ---
export async function createBusinessProfileFn(data: BusinessProfileFormType) {
	return (await axios.post(`${API_URL}/api/sme-profile/create`, data)).data;
}

export async function getMyBusinessProfileFn() {
	return (await axios.get(`${API_URL}/api/sme-profile/my-profile`)).data;
}

export async function getBusinessProfilesFn() {
	return (await axios.get(`${API_URL}/api/sme-profile/get`)).data;
}

export async function getBusinessProfileByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/sme-profile/show/${id}`)).data;
}

export async function approveBusinessProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/sme-profile/approve/${id}`)).data;
}

export async function rejectBusinessProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/sme-profile/reject/${id}`)).data;
}

export async function updateApproveBusinessProfileFn(id: string) {
	return (await axios.post(`${API_URL}/api/sme-profile/approve-update/${id}`))
		.data;
}

export async function updateRejectBusinessProfileFn(id: string) {
	return (await axios.post(`${API_URL}/api/sme-profile/reject-update/${id}`))
		.data;
}

const BusinessProfileApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				BusinessProfileFormType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createBusinessProfileFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", "my"] });
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

	GetMyProfile: {
		useQuery: (options?: UseQueryOptions<BusinessProfileType, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["BusinessProfile", "my"],
				queryFn: getMyBusinessProfileFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (
			options?: UseQueryOptions<BusinessProfileType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["BusinessProfile"],
				queryFn: getBusinessProfilesFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<BusinessProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["BusinessProfile", id],
				queryFn: () => getBusinessProfileByIdFn(id),
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
				mutationFn: approveBusinessProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					updateBusinessProfileCache(queryClient, id, {
						status: "APPROVED",
						approvedAt: getApprovedAt(res) ?? new Date().toISOString(),
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, id, context, undefined as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as never);
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
				mutationFn: rejectBusinessProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					updateBusinessProfileCache(queryClient, id, {
						status: "REJECTED",
						approvedAt: getApprovedAt(res),
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, id, context, undefined as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as never);
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
				mutationFn: updateApproveBusinessProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					updateBusinessProfileCache(queryClient, id, {
						updateStatus: "APPROVED",
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, id, context, undefined as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as never);
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
				mutationFn: updateRejectBusinessProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					updateBusinessProfileCache(queryClient, id, {
						updateStatus: "REJECTED",
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, id, context, undefined as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as never);
				},
				...options,
			});
		},
	},
};

export default BusinessProfileApi;
