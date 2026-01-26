import { ErrorRes, SuccessRes, FileType } from "@/types/core";
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

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

// --- 1. INTERFACES ---
export interface OpportunityFormType {
  isPublic: boolean;
  tags: string;
  image: FileType;
  title: string;
  organizationName: string;
  description: string;
  externalLink: string;
  deadlineDate: Date | string;
  source?: string;
}

export interface OpportunityType extends OpportunityFormType {
  _id: string;
  postedDate: string;
}

// --- 2. WORKER FUNCTIONS ---
export async function getOpportunitiesFn() {
  return (await axios.get(`${API_URL}/api/opportunity/get/`)).data;
}

export async function getOpportunityByIdFn(id: string) {
  return (await axios.get(`${API_URL}/api/opportunity/show/${id}`)).data;
}

export async function createOpportunityFn(data: OpportunityFormType) {
  return (await axios.post(`${API_URL}/api/opportunity/create`, data)).data;
}

export async function deleteOpportunityFn(id: string) {
  return (await axios.delete(`${API_URL}/api/opportunity/delete/${id}`)).data;
}

// --- 3. THE COMMAND CENTER ---
const OpportunityApi = {
  GetList: {
    useQuery: (
      options?: Omit<
        UseQueryOptions<OpportunityType[], AxiosError<ErrorRes>>,
        "queryKey" | "queryFn"
      >
    ) =>
      useQuery({
        queryKey: ["Opportunities"],
        queryFn: getOpportunitiesFn,
        ...options,
      }),
  },

  GetById: {
    useQuery: (
      id: string,
      options?: Omit<
        UseQueryOptions<OpportunityType, AxiosError<ErrorRes>>,
        "queryKey" | "queryFn"
      >
    ) =>
      useQuery({
        queryKey: ["Opportunities", id],
        queryFn: () => getOpportunityByIdFn(id),
        enabled: Boolean(id),
        ...options,
      }),
  },

  Create: {
    useMutation: (options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, OpportunityFormType>) => {
      const queryClient = useQueryClient();
      const router = useRouter();
      return useMutation({
        mutationFn: createOpportunityFn,
        onSuccess: (res, vars, ctx) => {
          toast.success("Opportunity Created!");
          queryClient.invalidateQueries({ queryKey: ["Opportunities"] });
          router.push("/opportunity");
          options?.onSuccess?.(res, vars, ctx, undefined as unknown as never);
        },
        ...options,
      });
    },
  },
  Update: {
    useMutation: (
      id: string,
      options?: UseMutationOptions<
        SuccessRes,
        AxiosError<ErrorRes>,
        Partial<OpportunityFormType>
      >
    ) => {
      const queryClient = useQueryClient();

      const userOnSuccess = options?.onSuccess;
      const userOnError = options?.onError;

      return useMutation({
        // This takes the data from the form/button and the ID from the card
        mutationFn: async (data: Partial<OpportunityFormType>) => 
          (await axios.put(`${API_URL}/api/opportunity/update/${id}`, data)).data,
        onSuccess: (res, vars, ctx) => {
          queryClient.invalidateQueries({ queryKey: ["Opportunities"] });
          userOnSuccess?.(res, vars, ctx, undefined as unknown as never);
        },
        onError: (err, vars, ctx) => {
          userOnError?.(err, vars, ctx, undefined as unknown as never);
        },
        ...options,
      });
    }
  },


  Delete: {
    useMutation: (options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: deleteOpportunityFn,
        onSuccess: (res, vars, ctx) => {
          toast.success("Deleted!");
          queryClient.invalidateQueries({ queryKey: ["Opportunities"] });
          options?.onSuccess?.(res, vars, ctx, undefined as unknown as never);
        },
        ...options,
      });
    },
  },
};

export default OpportunityApi;