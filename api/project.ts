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

export type ProjectStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type FundStatus = "PENDING" | "APPROVED" | "NOT_RETURNED" | "RETURNED";
export type ProjectUpdateStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ProjectGallery = FileType;

export interface ProjectUpdate {
	_id: string;
	title: string;
	description: string;
	date: string;
	status: ProjectUpdateStatus;
}

export interface ProjectFormType {
	projectName: string;
	description: string;
	legalFormat: string;
	categories: string[];
	fundingGoal: string;
	startDate: string;
	endDate: string;
	projectUpdates: ProjectUpdate[];
	projectGallery: ProjectGallery[];
	consent: boolean;
}

export interface ProjectType extends ProjectFormType {
	_id: string;
	smeId?: string;
	status: ProjectStatus | string;
	fundStatus: FundStatus;
	company: {
		_id: string;
		smeId: string;
		businessName: string;
	};
}

// --- Worker functions ---
export async function createProjectFn(data: ProjectFormType) {
	return (await axios.post(`${API_URL}/api/project/create`, data)).data;
}

export async function deleteProjectFn(id: string) {
	return (await axios.delete(`${API_URL}/api/project/delete/${id}`)).data;
}

export async function updateProjectFn(id: string, data: Partial<ProjectFormType>) {
	return (await axios.put(`${API_URL}/api/project/update/${id}`, data)).data;
}

export async function getMyProjectsFn() {
	return (await axios.get(`${API_URL}/api/project/myproject`)).data;
}

export async function getProjectsFn() {
	return (await axios.get(`${API_URL}/api/project/get`)).data;
}

export async function getProjectByIdFn(id: string) {
	const res = (await axios.get(`${API_URL}/api/project/show/${id}`)).data;
	return Array.isArray(res) ? res[0] : res;
}

export async function approveProjectFn(id: string) {
	return (await axios.post(`${API_URL}/api/project/approve/${id}`)).data;
}

export async function rejectProjectFn(id: string) {
	return (await axios.post(`${API_URL}/api/project/reject/${id}`)).data;
}

export async function approveProjectUpdateFn(pid: string, id: string) {
	return (await axios.post(`${API_URL}/api/project/approve-update/${pid}/${id}/`)).data;
}

export async function rejectProjectUpdateFn(pid: string, id: string) {
	return (await axios.post(`${API_URL}/api/project/reject-update/${pid}/${id}/`)).data;
}

const ProjectApi = {
	GetMyList: {
		useQuery: (
			options?: Omit<
				UseQueryOptions<ProjectType[], AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Projects", "my"],
				queryFn: getMyProjectsFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (
			options?: Omit<
				UseQueryOptions<ProjectType[], AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Projects"],
				queryFn: getProjectsFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: Omit<
				UseQueryOptions<ProjectType, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["Projects", id],
				queryFn: () => getProjectByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	Create: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, ProjectFormType>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createProjectFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Project created");
					queryClient.invalidateQueries({ queryKey: ["Projects"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", "my"] });
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
			id: string,
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, Partial<ProjectFormType>>
		) => {
			const queryClient = useQueryClient();

			const userOnSuccess = options?.onSuccess;
			const userOnError = options?.onError;

			return useMutation({
				mutationFn: (data) => updateProjectFn(id, data),
				onSuccess: (res, vars, ctx) => {
					toast.success(res.message || "Updated");
					queryClient.invalidateQueries({ queryKey: ["Projects"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", id] });
					userOnSuccess?.(res, vars, ctx, undefined as unknown as never);
				},
				onError: (err, vars, ctx) => {
					toast.error(err.response?.data?.message || "Error");
					userOnError?.(err, vars, ctx, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Delete: {
		useMutation: (options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deleteProjectFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Deleted");
					queryClient.invalidateQueries({ queryKey: ["Projects"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", "my"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", id] });
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
		useMutation: (options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: approveProjectFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					queryClient.invalidateQueries({ queryKey: ["Projects"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", id] });
					queryClient.invalidateQueries({ queryKey: ["Projects", "my"] });
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
		useMutation: (options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: rejectProjectFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Rejected");
					queryClient.invalidateQueries({ queryKey: ["Projects"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", id] });
					queryClient.invalidateQueries({ queryKey: ["Projects", "my"] });
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

	ApproveUpdate: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, { pid: string; id: string }>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: ({ pid, id }) => approveProjectUpdateFn(pid, id),
				onSuccess: (res, vars, context) => {
					toast.success(res.message || "Update approved");
					queryClient.invalidateQueries({ queryKey: ["Projects"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", vars.pid] });
					queryClient.invalidateQueries({ queryKey: ["Projects", "my"] });
					options?.onSuccess?.(res, vars, context, undefined as unknown as never);
				},
				onError: (err, vars, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, vars, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	RejectUpdate: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, { pid: string; id: string }>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: ({ pid, id }) => rejectProjectUpdateFn(pid, id),
				onSuccess: (res, vars, context) => {
					toast.success(res.message || "Update rejected");
					queryClient.invalidateQueries({ queryKey: ["Projects"] });
					queryClient.invalidateQueries({ queryKey: ["Projects", vars.pid] });
					queryClient.invalidateQueries({ queryKey: ["Projects", "my"] });
					options?.onSuccess?.(res, vars, context, undefined as unknown as never);
				},
				onError: (err, vars, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, vars, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},
};

export default ProjectApi;
