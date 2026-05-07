import { ErrorRes, SuccessRes } from "@/types/core";
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

export interface ProfileFormType {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
}

export interface ProfileType extends ProfileFormType {
	_id: string;
	status: "ACTIVE" | "TERMINATED";
	createdAt: string;
	approvedAt: string;
}

// --- Worker functions ---
export async function createAdminFn(data: ProfileFormType) {
	return (await axios.post(`${API_URL}/api/user/create`, data)).data;
}

export async function getMyProfileFn() {
	return (await axios.get(`${API_URL}/api/user/my-profile`)).data;
}

export async function getAdminFn() {
	return (await axios.get(`${API_URL}/api/user/get`)).data;
}

export async function getAdminByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/user/show/${id}`)).data;
}

export async function deleteAdminFn(id: string) {
	return (await axios.delete(`${API_URL}/api/user/${id}`)).data;
}

export async function deactivateAdminFn(id: string) {
	return (await axios.patch(`${API_URL}/api/user/terminate/${id}`)).data;
}

export async function activateAdminFn(id: string) {
	return (await axios.patch(`${API_URL}/api/user/unterminate/${id}`)).data;
}

const AdminProfileApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, ProfileFormType>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createAdminFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["AdminProfile"] });
					queryClient.invalidateQueries({ queryKey: ["AdminProfile", "my"] });
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
				queryKey: ["AdminProfile", "my"],
				queryFn: getMyProfileFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (options?: UseQueryOptions<ProfileType[], AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["AdminProfile"],
				queryFn: getAdminFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<ProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["AdminProfile", id],
				queryFn: () => getAdminByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	Delete: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deleteAdminFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Deleted");
					queryClient.invalidateQueries({ queryKey: ["AdminProfile"] });
					queryClient.invalidateQueries({ queryKey: ["AdminProfile", id] });
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

	Deactivate: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deactivateAdminFn,
				onSuccess: (res, id, context) => {
					toast.success("activated");
					queryClient.invalidateQueries({ queryKey: ["AdminProfile"] });
					queryClient.invalidateQueries({ queryKey: ["AdminProfile", id] });
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

	Activate: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: activateAdminFn,
				onSuccess: (res, id, context) => {
					toast.success("deactivated");
					queryClient.invalidateQueries({ queryKey: ["AdminProfile"] });
					queryClient.invalidateQueries({ queryKey: ["AdminProfile", id] });
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

export default AdminProfileApi;
