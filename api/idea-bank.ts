import { ErrorRes, SuccessRes, FileType } from "@/types/core";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation"; // App Router version
import { toast } from "sonner"; // Using your project's toast system

// --- 1. INTERFACES (The Blueprints) ---
export interface IdeaBankType {
  _id: string;
  isPublic: boolean;
  image: FileType;
  title: string;
  description: string;
  tags: string;
  source: string;
  datePosted: string;
}

export interface IdeaBankFormType {
  isPublic: boolean;
  image: FileType;
  title: string;
  description: string;
  tags: string;
  source: string;
}

export type IdeaBankUpdateType = Partial<IdeaBankFormType>;
const API_URL = process.env.NEXT_PUBLIC_BASE_URL;
// --- 2. WORKER FUNCTIONS (Axios) ---
export async function getIdeaBankFn() {
  return (await axios.get(`${API_URL}/api/idea-bank/get/`)).data;
}

export async function getIdeaBankByIdFn(id: string) {
   return (await axios.get(`${API_URL}/api/idea-bank/show/${id}`)).data;
}


export async function createIdeaFn(data: IdeaBankFormType) {
  return (await axios.post(`${API_URL}/api/idea-bank/create`, data)).data;
}

export async function deleteIdeaFn(id: string) {
  return (await axios.delete(`${API_URL}/api/idea-bank/delete/${id}`)).data;
}

export async function updateIdeaFn(id: string, data: IdeaBankUpdateType) {
  try {
    return (await axios.put(`${API_URL}/api/idea-bank/update/${id}`, data)).data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status === 404) {
      return (
        await axios.patch(`${API_URL}/api/idea-bank/update`, {
          ...data,
          id,
          _id: id,
        })
      ).data;
    }
    throw error;
  }
}

// --- 3. THE COMMAND CENTER (Hooks) ---
const IdeaBankApi = {
  // READ: Get All
  GetList: {
    useQuery: (
      options?: Omit<
        UseQueryOptions<IdeaBankType[], AxiosError<ErrorRes>>,
        "queryKey" | "queryFn"
      >
    ) =>
      useQuery({
        queryKey: ["IdeaBank"],
        queryFn: getIdeaBankFn,
        ...options,
      }),
  },

  // READ: Get By Id
  GetById: {
    useQuery: (
      id: string,
      options?: Omit<
        UseQueryOptions<IdeaBankType, AxiosError<ErrorRes>>,
        "queryKey" | "queryFn"
      >
    ) =>
      useQuery({
        queryKey: ["IdeaBank", id],
        queryFn: () => getIdeaBankByIdFn(id),
        enabled: Boolean(id) && (options?.enabled ?? true),
        ...options,
      }),
  },

  // CREATE
  Create: {
    useMutation: (options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, IdeaBankFormType>) => {
      const queryClient = useQueryClient();
      const router = useRouter();

      return useMutation<SuccessRes, AxiosError<ErrorRes>, IdeaBankFormType>({
        mutationFn: createIdeaFn,
        ...options,
        onSuccess: (res, variables, context) => {
          toast.success(res.message || "Idea created!");
          queryClient.invalidateQueries({ queryKey: ["IdeaBank"] }); // Refresh the list
          router.push("/idea-bank"); // Go back to list
          options?.onSuccess?.(res, variables, context, undefined as unknown as never);
        },
        onError: (err, variables, context) => {
          toast.error(err.response?.data?.message || "Error");
          options?.onError?.(err, variables, context, undefined as unknown as never);
        },
      });
    }
  },

  // UPDATE
 Update: {
    useMutation: (
      id: string,
      options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, IdeaBankUpdateType>
    ) => {
      const queryClient = useQueryClient();

      const userOnSuccess = options?.onSuccess;
      const userOnError = options?.onError;

      return useMutation({
        mutationFn: (data: IdeaBankUpdateType) => updateIdeaFn(id, data),
        onSuccess: (res, vars, ctx) => {
          queryClient.invalidateQueries({ queryKey: ["IdeaBank"] });
          queryClient.invalidateQueries({ queryKey: ["IdeaBank", id] });
          userOnSuccess?.(res, vars, ctx, undefined as unknown as never);
        },
        onError: (err, vars, ctx) => {
          userOnError?.(err, vars, ctx, undefined as unknown as never);
        },
        ...options,
      });
    },
  },
  // DELETE
  Delete: {
    useMutation: (options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>) => {
      const queryClient = useQueryClient();

      return useMutation<SuccessRes, AxiosError<ErrorRes>, string>({
        mutationFn: deleteIdeaFn,
        ...options,
        onSuccess: (res, variables, context) => {
          toast.success(res.message || "Idea deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["IdeaBank"] });
          options?.onSuccess?.(res, variables, context, undefined as unknown as never);
        },
        onError: (err, variables, context) => {
          toast.error(err.response?.data?.message || "Failed to delete");
          options?.onError?.(err, variables, context, undefined as unknown as never);
        },
      });
    }
  }
};

export default IdeaBankApi;