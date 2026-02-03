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

import { type SMEProfileType } from "@/api/Buisness";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface Invitation {
	_id: string;
	advisorId: string;
	smeId: string;
	invitationsentId: string;
	paymentTerm: string;
	paymentTermBy: string;
	duration: string;
	durationby: string;
	offeredSalary: string;
	location: string;
	description: string;
	status: string;
	contratStatus: string;
	createdAt: string;
	__v: number;
	acceptedAt: string;
}

export interface Advisor {
	_id: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	isActive: boolean;
	email: string;
	role: string;
}

export interface Avatar {
	url: string;
	id: string;
}

export interface SocialNetworkLink {
	_id?: string;
	name: string;
	link: string;
}

export interface Business {
	avatar: Avatar;
	_id: string;
	smeId: string;
	businessName: string;
	email: string;
	bphoneNumber: string;
	industry: string;
	staffSize: string;
	website: string;
	legalFormat: string;
	address: string;
	categories: string[];
	description: string;
	status: string;
	attachment: FileType[];
	gallery: FileType[];
	socialNetwork: SocialNetworkLink[];
	__v: number;
	consent: boolean;
	dateOfRegistration: string;
	revenueRange: string;
	approvedAt: string;
	approvedBy: string;
	updateStatus: string;
}

export interface InvitationResData {
	invitation: Invitation;
	business: Business;
	advisor: Advisor;
}

export interface InvitationFormType {
	advisorId: string;
	smeId: string;
	duration: string;
	durationby: string;
	offeredSalary: string;
	location: string;
	paymentTerm: string;
	paymentTermBy: string;
	invitationsentById: string;
	description: string;
}

export interface InvitationType extends InvitationFormType {
	_id: string;
	status: string;
	advisor: {
		fullName: string;
		avatar: FileType;
		advisorId: string;
	};
	company: SMEProfileType;
}

export interface PaymentForm {
	InvitationId: string;
	senderName: string;
	senderAccount?: string;
	transactionId?: string;
	bank: string;
	gallery: FileType[];
	remark: string;
}

// --- Worker functions ---
export async function inviteFn(data: InvitationFormType) {
	return (await axios.post(`${API_URL}/api/invitation/create/`, data)).data;
}

export async function getInvitationsFn() {
	return (await axios.get(`${API_URL}/api/invitation/get/`)).data;
}

export async function getInvitationByIdFn(invitationId: string) {
	return (await axios.get(`${API_URL}/api/invitation/show/${invitationId}`)).data;
}

export async function acceptInvitationFn(invitationId: string) {
	return (await axios.post(`${API_URL}/api/invitation/accept/${invitationId}`)).data;
}

export async function rejectInvitationFn(invitationId: string) {
	return (await axios.post(`${API_URL}/api/invitation/reject/${invitationId}`)).data;
}

export async function hireInvitationFn(
	invitationId: string,
	data: { startDate: string; status: string }
) {
	return (await axios.post(`${API_URL}/api/invitation/hire/${invitationId}`, data))
		.data;
}

export async function payInvitationFn(invitationId: string, data: PaymentForm) {
	return (await axios.post(`${API_URL}/api/invitation/pay/${invitationId}`, data)).data;
}

export async function getMyInvitationsAsSmeFn() {
	return (await axios.get(`${API_URL}/api/invitation/getAllBySMEId/`)).data;
}

export async function getMyInvitationsAsAdvisorFn() {
	return (await axios.get(`${API_URL}/api/invitation/advisor-invitations`)).data;
}

type ToastCtx = { toastId?: string | number };

const InvitationApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				InvitationFormType,
				ToastCtx
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: inviteFn,
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Invitation sent");
					queryClient.invalidateQueries({ queryKey: ["Invitations"] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Accept: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string, ToastCtx>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: acceptInvitationFn,
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, id, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Accepted");
					queryClient.invalidateQueries({ queryKey: ["Invitations"] });
					queryClient.invalidateQueries({ queryKey: ["Invitations", id] });
					options?.onSuccess?.(res, id, context, undefined as unknown as never);
				},
				onError: (err, id, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Reject: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string, ToastCtx>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: rejectInvitationFn,
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, id, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Rejected");
					queryClient.invalidateQueries({ queryKey: ["Invitations"] });
					queryClient.invalidateQueries({ queryKey: ["Invitations", id] });
					options?.onSuccess?.(res, id, context, undefined as unknown as never);
				},
				onError: (err, id, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Hire: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				{ _id: string; startDate: string; status: string },
				ToastCtx
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: ({ _id, startDate, status }) =>
					hireInvitationFn(_id, { startDate, status }),
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Updated");
					queryClient.invalidateQueries({ queryKey: ["Invitations"] });
					queryClient.invalidateQueries({ queryKey: ["Invitations", variables._id] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Pay: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				{ _id: string; data: PaymentForm },
				ToastCtx
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: ({ _id, data }) => payInvitationFn(_id, data),
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Paid");
					queryClient.invalidateQueries({ queryKey: ["Invitations"] });
					queryClient.invalidateQueries({ queryKey: ["Invitations", variables._id] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	GetList: {
		useQuery: (
			options?: Omit<
				UseQueryOptions<InvitationType[], AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Invitations"],
				queryFn: getInvitationsFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: Omit<
				UseQueryOptions<InvitationResData, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Invitations", id],
				queryFn: () => getInvitationByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	GetMyAsAdvisor: {
		useQuery: (
			options?: Omit<
				UseQueryOptions<InvitationType[], AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Invitations", "my", "advisor"],
				queryFn: getMyInvitationsAsAdvisorFn,
				...options,
			}),
	},

	GetMyAsSme: {
		useQuery: (
			options?: Omit<
				UseQueryOptions<InvitationType[], AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Invitations", "my", "sme"],
				queryFn: getMyInvitationsAsSmeFn,
				...options,
			}),
	},
};

export default InvitationApi;

