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

export interface CohortType {
	id: number;
	name: string;
	idnumber: string;
	description: string;
	descriptionformat: number;
	visible: boolean;
	theme: string;
}

export interface AddAndRemoveType {
	cohortId: number;
	courseId: string;
}

export interface BulkAddReqType {
	trannieIds: string[];
	cohortId: number;
}

export interface AddReqType {
	trannieId: string;
	cohortId: number;
}

// --- Worker functions ---
export async function getAllCohortFn() {
	return (await axios.get(`${API_URL}/api/cohort/get`)).data as CohortType[];
}

export async function showCohortFn(id: string) {
	return (await axios.get(`${API_URL}/api/cohort/show/${id}`)).data as CohortType;
}

export async function addCourseFn({ cohortId, courseId }: AddAndRemoveType) {
	return (
		await axios.post(`${API_URL}/api/cohort/add/${cohortId}/${courseId}`)
	).data as SuccessRes;
}

export async function removeCourseFn({ cohortId, courseId }: AddAndRemoveType) {
	return (
		await axios.post(`${API_URL}/api/cohort/remove/${cohortId}/${courseId}`)
	).data as SuccessRes;
}

export async function addBulkFn(data: BulkAddReqType) {
	return (await axios.post(`${API_URL}/api/cohort/add-bulk`, data)).data as SuccessRes;
}

export async function addFn(data: AddReqType) {
	return (await axios.post(`${API_URL}/api/cohort/add`, data)).data as SuccessRes;
}

const CohortApi = {
	GetList: {
		useQuery: (
			options?: UseQueryOptions<CohortType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["cohorts"],
				queryFn: getAllCohortFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<CohortType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["cohorts", id],
				queryFn: () => showCohortFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	AddCourse: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				AddAndRemoveType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: addCourseFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Course added");
					queryClient.invalidateQueries({ queryKey: ["cohorts"] });
					options?.onSuccess?.(
						res,
						variables,
						context,
						undefined as unknown as never
					);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(
						err,
						variables,
						context,
						undefined as unknown as never
					);
				},
				...options,
			});
		},
	},

	RemoveCourse: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				AddAndRemoveType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: removeCourseFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Course removed");
					queryClient.invalidateQueries({ queryKey: ["cohorts"] });
					options?.onSuccess?.(
						res,
						variables,
						context,
						undefined as unknown as never
					);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(
						err,
						variables,
						context,
						undefined as unknown as never
					);
				},
				...options,
			});
		},
	},

	AddSingle: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, AddReqType>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: addFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Added to cohort");
					queryClient.invalidateQueries({ queryKey: ["cohorts"] });
					options?.onSuccess?.(
						res,
						variables,
						context,
						undefined as unknown as never
					);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(
						err,
						variables,
						context,
						undefined as unknown as never
					);
				},
				...options,
			});
		},
	},

	AddBulk: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				BulkAddReqType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: addBulkFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Bulk add complete");
					queryClient.invalidateQueries({ queryKey: ["cohorts"] });
					options?.onSuccess?.(
						res,
						variables,
						context,
						undefined as unknown as never
					);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(
						err,
						variables,
						context,
						undefined as unknown as never
					);
				},
				...options,
			});
		},
	},
};

export default CohortApi;
