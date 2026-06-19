import { ErrorRes, FileType, SuccessRes } from "@/types/core";
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

export interface SkillType {
	_id: string;
	isPublic: boolean;
	image: FileType;
	title: string;
	description: string;
	tags: string;
	source: string;
	datePosted: string;
}

export interface SkillFormType {
	isPublic: boolean;
	image: FileType;
	title: string;
	description: string;
	tags: string;
	source: string;
}

export type SkillUpdateType = Partial<SkillFormType>;

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

type QueryOptions<TData> = Omit<
	UseQueryOptions<TData, AxiosError<ErrorRes>>,
	"queryKey" | "queryFn"
>;

export async function getSkillsFn() {
	return (await axios.get(`${API_URL}/api/skill/get`)).data;
}

export async function getSkillByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/skill/show/${id}`)).data;
}

export async function createSkillFn(data: SkillFormType) {
	return (await axios.post(`${API_URL}/api/skill/create`, data)).data;
}

export async function deleteSkillFn(id: string) {
	return (await axios.delete(`${API_URL}/api/skill/delete/${id}`)).data;
}

export async function updateSkillFn(id: string, data: SkillUpdateType) {
	return (await axios.put(`${API_URL}/api/skill/update/${id}`, data)).data;
}

const SkillsApi = {
	GetList: {
		useQuery: (options?: QueryOptions<SkillType[]>) =>
			useQuery({
				queryKey: ["Skills"],
				queryFn: getSkillsFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (id: string, options?: QueryOptions<SkillType>) =>
			useQuery({
				queryKey: ["Skills", id],
				queryFn: () => getSkillByIdFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	Create: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, SkillFormType>
		) => {
			const queryClient = useQueryClient();
			const router = useRouter();

			return useMutation({
				mutationFn: createSkillFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Skill created!");
					queryClient.invalidateQueries({ queryKey: ["Skills"] });
					router.push("/skills");
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
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, SkillUpdateType>
		) => {
			const queryClient = useQueryClient();

			const userOnSuccess = options?.onSuccess;
			const userOnError = options?.onError;

			return useMutation({
				mutationFn: (data: SkillUpdateType) => updateSkillFn(id, data),
				onSuccess: (res, vars, ctx) => {
					queryClient.invalidateQueries({ queryKey: ["Skills"] });
					queryClient.invalidateQueries({ queryKey: ["Skills", id] });
					userOnSuccess?.(res, vars, ctx, undefined as unknown as never);
				},
				onError: (err, vars, ctx) => {
					userOnError?.(err, vars, ctx, undefined as unknown as never);
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
				mutationFn: deleteSkillFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Skill deleted successfully");
					queryClient.invalidateQueries({ queryKey: ["Skills"] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Failed to delete");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},
};

export default SkillsApi;
