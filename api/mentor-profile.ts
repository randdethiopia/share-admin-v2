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

export interface MentorProfileFormType {
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

export interface MentorProfileType extends MentorProfileFormType {
	_id: string;
	mentorId: string;
	status: string;
	approvedBy: string;
	approvedAt?: string | null;
	createdAt?: string;
}

// --- Worker functions ---
async function tryGet(urls: string[]) {
	let lastError: unknown;
	for (const url of urls) {
		try {
			const res = await axios.get(url);
			return res.data?.data ?? res.data;
		} catch (error) {
			const status = axios.isAxiosError(error)
				? error.response?.status
				: undefined;
			if (status && status !== 404) throw error;
			lastError = error;
		}
	}
	throw lastError;
}

async function tryPatch(urls: string[]) {
	let lastError: unknown;
	for (const url of urls) {
		try {
			const res = await axios.patch(url);
			return res.data?.data ?? res.data;
		} catch (error) {
			const status = axios.isAxiosError(error)
				? error.response?.status
				: undefined;
			if (status && status !== 404) throw error;
			lastError = error;
		}
	}
	throw lastError;
}

export async function createMentorProfileFn(data: MentorProfileFormType) {
	return (await axios.post(`${API_URL}/api/mentor-profile/create`, data)).data;
}

export async function getMyMentorProfileFn() {
	return tryGet([
		`${API_URL}/api/mentor-profile/my-profile`,
		`${API_URL}/api/mentor/my-profile`,
		`${API_URL}/api/investor-profile/my-profile`,
	]);
}

export async function getMentorProfilesFn() {
	return tryGet([
		`${API_URL}/api/mentor-profile/get`,
		`${API_URL}/api/mentor/get`,
		`${API_URL}/api/investor-profile/get`,
	]);
}

export async function getMentorProfileByIdFn(id: string) {
	return tryGet([
		`${API_URL}/api/mentor-profile/show/${id}`,
		`${API_URL}/api/mentor/show/${id}`,
		`${API_URL}/api/investor-profile/show/${id}`,
	]);
}

export async function approveMentorProfileFn(id: string) {
	return tryPatch([
		`${API_URL}/api/mentor-profile/approve/${id}`,
		`${API_URL}/api/mentor/approve/${id}`,
		`${API_URL}/api/investor-profile/approve/${id}`,
	]);
}

export async function rejectMentorProfileFn(id: string) {
	return tryPatch([
		`${API_URL}/api/mentor-profile/reject/${id}`,
		`${API_URL}/api/mentor/reject/${id}`,
		`${API_URL}/api/investor-profile/reject/${id}`,
	]);
}

const MentorProfileApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				MentorProfileFormType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createMentorProfileFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["mentor-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["mentor-profile", "my"] });
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
		useQuery: (options?: UseQueryOptions<MentorProfileType, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["mentor-profile", "my"],
				queryFn: getMyMentorProfileFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (
			options?: UseQueryOptions<MentorProfileType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["mentor-profiles"],
				queryFn: getMentorProfilesFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<MentorProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["mentor-profiles", id],
				queryFn: () => getMentorProfileByIdFn(id),
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
				mutationFn: approveMentorProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					queryClient.invalidateQueries({ queryKey: ["mentor-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["mentor-profiles", id] });
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
				mutationFn: rejectMentorProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					queryClient.invalidateQueries({ queryKey: ["mentor-profiles"] });
					queryClient.invalidateQueries({ queryKey: ["mentor-profiles", id] });
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

export default MentorProfileApi;
