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
	name: string;
	link: string;
}

export interface EducationType {
	title: string;
	type: string;
	academy: string;
	year: string;
	description: string;
}

export interface ExperienceType {
	title: string;
	type: string;
	company: string;
	startDate: string;
	endDate: string;
	description: string;
}

export interface ExpertiseType {
	title: string;
	description: string;
}

export interface ProfileFormType {
	fullName: string;
	gender: string;
	birthDate: string;
	email: string;
	phoneNumber: string;
	qualification: string;
	experienceYear: string;
	salaryExpectation: string;
	paymentTerms: string;
	description: string;
	skills: string[];
	languages: string[];
	categories: string[];
	socialNetwork: SocialType[];
	education: EducationType[];
	experience: ExperienceType[];
	expertise: ExpertiseType[];
	cv: FileType;
	avatar: FileType;
}

export interface ProfileType extends ProfileFormType {
	_id: string;
	advisorId: string;
	status: string;
	createdAt: string;
	approvedAt: string;
}

// --- Worker functions ---
export async function createAdvisorProfileFn(data: ProfileFormType) {
	return (await axios.post(`${API_URL}/api/advisor-profile/create`, data)).data;
}

export async function getMyAdvisorProfileFn() {
	return (await axios.get(`${API_URL}/api/advisor-profile/my-profile`)).data;
}

export async function getAdvisorProfilesFn() {
	return (await axios.get(`${API_URL}/api/advisor-profile/get`)).data;
}

export async function getAdvisorProfileByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/advisor-profile/show/${id}`)).data;
}

export async function approveAdvisorProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/advisor-profile/approve/${id}`)).data;
}

export async function rejectAdvisorProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/advisor-profile/reject/${id}`)).data;
}

const AdvisorProfileApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, ProfileFormType>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createAdvisorProfileFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["AdvisorProfile"] });
					queryClient.invalidateQueries({ queryKey: ["AdvisorProfile", "my"] });
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
		useQuery: (options?: UseQueryOptions<ProfileType, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["AdvisorProfile", "my"],
				queryFn: getMyAdvisorProfileFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (options?: UseQueryOptions<ProfileType[], AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["AdvisorProfile"],
				queryFn: getAdvisorProfilesFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<ProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["AdvisorProfile", id],
				queryFn: () => getAdvisorProfileByIdFn(id),
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
				mutationFn: approveAdvisorProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					queryClient.invalidateQueries({ queryKey: ["AdvisorProfile"] });
					queryClient.invalidateQueries({ queryKey: ["AdvisorProfile", id] });
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
				mutationFn: rejectAdvisorProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					queryClient.invalidateQueries({ queryKey: ["AdvisorProfile"] });
					queryClient.invalidateQueries({ queryKey: ["AdvisorProfile", id] });
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

export default AdvisorProfileApi;
