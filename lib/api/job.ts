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

const API_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

// Interfaces
export interface JobLocation {
  type?: string;
  coordinates?: number[];
  address?: string;
}

export interface JobType {
  _id: string;
  businessId?: unknown;
  title?: string;
  jobTitle?: string;
  companyName?: string;
  description?: string;
  jobDescription?: string;
  requirements?: string | string[];
  location?: string | JobLocation;
  jobType?: string;
  employmentType?: string;
  salary?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  createdAt: string;
  updatedAt: string;
}

export async function getJobsFn(): Promise<JobType[]> {
  const response = await axios.get(`${API_URL}/api/job/get`);
  // Sometimes backend returns \{ jobs: [] \} or similar, but let's assume it returns data directly or inside data
  return response.data?.jobs || response.data?.data || response.data;
}

export async function approveJobFn(id: string): Promise<SuccessRes> {
  return (await axios.post(`${API_URL}/api/job/approve/${id}`)).data;
}

export async function rejectJobFn(id: string): Promise<SuccessRes> {
  return (await axios.post(`${API_URL}/api/job/reject/${id}`)).data;
}

export const JobApi = {
  GetList: {
    useQuery: (
      options?: Omit<
        UseQueryOptions<JobType[], AxiosError<ErrorRes>>,
        "queryKey" | "queryFn"
      >,
    ) =>
      useQuery({
        queryKey: ["Jobs"],
        queryFn: getJobsFn,
        ...options,
      }),
  },
  Approve: {
    useMutation: (
      options?: Omit<
        UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>,
        "mutationFn"
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: approveJobFn,
        ...options,
        onSuccess: (data, variables, context, meta) => {
          toast.success(data.message || "Job approved successfully!");
          queryClient.setQueryData<JobType[]>(["Jobs"], (prev) =>
            prev?.map((job) =>
              job._id === variables ? { ...job, status: "APPROVED" } : job
            )
          );
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["Jobs"] });
          }, 1500);
          options?.onSuccess?.(data, variables, context, meta);
        },
        onError: (error, variables, context, meta) => {
          toast.error(error.response?.data?.message || "Failed to approve job");
          options?.onError?.(error, variables, context, meta);
        },
      });
    },
  },
  Reject: {
    useMutation: (
      options?: Omit<
        UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>,
        "mutationFn"
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: rejectJobFn,
        ...options,
        onSuccess: (data, variables, context, meta) => {
          toast.error(data.message || "Job rejected successfully!");
          queryClient.setQueryData<JobType[]>(["Jobs"], (prev) =>
            prev?.map((job) =>
              job._id === variables ? { ...job, status: "REJECTED" } : job
            )
          );
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["Jobs"] });
          }, 1500);
          options?.onSuccess?.(data, variables, context, meta);
        },
        onError: (error, variables, context, meta) => {
          toast.error(error.response?.data?.message || "Failed to reject job");
          options?.onError?.(error, variables, context, meta);
        },
      });
    },
  },
};
