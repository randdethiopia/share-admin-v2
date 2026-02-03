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

import { type ProfileType } from "@/api/advisor-profile";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

type QueryOptions<TData> = Omit<
	UseQueryOptions<TData, AxiosError<ErrorRes>>,
	"queryKey" | "queryFn"
>;

export type BlogStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | string;

export interface BlogUpdate {
	title: string;
	description: string;
	date: string;   
}

export interface BlogFormType {
	title: string;
	description: string;
	files: FileType;
}

export interface BlogType extends BlogFormType {
	_id: string;
	authorId?: string;
	status: BlogStatus;
	approvedAt?: string;
	createdAt: string;
	__v?: number;
	advisor: ProfileType;
}

export async function createBlogFn(data: BlogFormType) {
	return (await axios.post(`${API_URL}/api/blog/create`, data)).data;
}

export async function deleteBlogFn(id: string) {
	return (await axios.delete(`${API_URL}/api/blog/delete/${id}`)).data;
}

export async function updateBlogFn(id: string, data: BlogFormType) {
	return (await axios.put(`${API_URL}/api/blog/update/${id}`, data)).data;
}

export async function getMyBlogsFn() {
	return (await axios.get(`${API_URL}/api/blog/myBlog`)).data;
}

export async function getBlogByIdFn(id: string) {
	const res = (await axios.get(`${API_URL}/api/blog/show/${id}`)).data;
	return Array.isArray(res) ? res[0] : res;
}

export async function getBlogsFn() {
	return (await axios.get(`${API_URL}/api/blog/get/`)).data;
}

export async function approveBlogFn(id: string) {
	return (await axios.patch(`${API_URL}/api/blog/approve/${id}`)).data;
}

export async function rejectBlogFn(id: string) {
	return (await axios.patch(`${API_URL}/api/blog/reject/${id}`)).data;
}

const BlogApi = {
	GetMyList: {
		useQuery: (options?: QueryOptions<BlogType[]>) =>
			useQuery({
				queryKey: ["Blogs", "my"],
				queryFn: getMyBlogsFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (options?: QueryOptions<BlogType[]>) =>
			useQuery({
				queryKey: ["Blogs"],
				queryFn: getBlogsFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: QueryOptions<BlogType>
		) =>
			useQuery({
				queryKey: ["Blogs", id],
				queryFn: () => getBlogByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	Create: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, BlogFormType>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createBlogFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["Blogs"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", "my"] });
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

	Update: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				{ id: string; data: BlogFormType }
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: ({ id, data }) => updateBlogFn(id, data),
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Updated successfully");
					queryClient.invalidateQueries({ queryKey: ["Blogs"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", variables.id] });
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

	Delete: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deleteBlogFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Deleted");
					queryClient.invalidateQueries({ queryKey: ["Blogs"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", id] });
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

	Approve: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: approveBlogFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					queryClient.invalidateQueries({ queryKey: ["Blogs"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", id] });
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
				mutationFn: rejectBlogFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					queryClient.invalidateQueries({ queryKey: ["Blogs"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Blogs", id] });
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

export default BlogApi;

