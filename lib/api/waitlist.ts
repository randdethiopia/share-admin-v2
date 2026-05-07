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
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const waitListFormSchema = z.object({
	// Personal Info
	fullName: z
		.string()
		.min(2, { message: "Full name must be at least 2 characters." }),
	phoneNumber: z
		.string()
		.min(10, { message: "Please enter a valid phone number." }),
	email: z.string().email({ message: "Please enter a valid email address." }),
	age: z.coerce.number().min(18, { message: "You must be at least 18 years old." }),
	birthDate: z
		.string()
		.min(10)
		.max(10)
		.regex(/^\d{4}-\d{2}-\d{2}$/, {
			message: "Birth date must be in YYYY-MM-DD format.",
		}),
	sex: z.enum(["male", "female"] as const, {
		message: "Please select your sex.",
	}),
	maritalStatus: z.enum(
		["single", "married", "divorced", "widowed", "prefer-not-to-say"] as const,
		{
			message: "Please select your marital status.",
		}
	),
	hasDisability: z.boolean(),
	disabilityDetails: z.string().optional(),
	digitalDevices: z.array(z.string()).optional(),

	// Product Application
	educationLevel: z
		.string({ message: "Please select your education level." })
		.min(1, { message: "Please select your education level." }),
	studySubject: z.string().optional(),
	region: z.string().min(1, { message: "Region is required." }),
	subcity: z.string().min(1, { message: "Subcity is required." }),
	woreda: z.string().min(1, { message: "Woreda is required." }),
	zone: z.string().min(1, { message: "Zone is required." }),
	currentEmploymentStatus: z
		.string({ message: "Please select your current employment status." })
		.min(1, { message: "Please select your current employment status." }),
	otherCurrentEmployment: z.string().optional(),
	previousEmploymentStatus: z
		.string({ message: "Please select your previous employment status." })
		.min(1, { message: "Please select your previous employment status." }),
	otherPreviousEmployment: z.string().optional(),
	monthlyEarnings: z.string().optional(),

	// Ethical AI
	hasComputerAccess: z.boolean({
		message: "Please indicate if you have computer access.",
	}),
	weeklyCommitment: z
		.string({ message: "Please select your weekly commitment." })
		.min(1, { message: "Please select your weekly commitment." }),
	computerSkill: z
		.string({ message: "Please select your computer skill level." })
		.min(1, { message: "Please select your computer skill level." }),
	internetSkill: z
		.string({ message: "Please select your internet skill level." })
		.min(1, { message: "Please select your internet skill level." }),
	mediaSkill: z
		.string({ message: "Please select your media skill level." })
		.min(1, { message: "Please select your media skill level." }),
	englishProficiency: z
		.string({ message: "Please select your English proficiency." })
		.min(1, { message: "Please select your English proficiency." }),
	amharicProficiency: z
		.string({ message: "Please select your Amharic proficiency." })
		.min(1, { message: "Please select your Amharic proficiency." }),
	prevMasterCardMember: z.boolean({
		message: "Please fill out this field",
	}),
	doYouAcceptSafeguardingConducts: z.boolean({
		message: "Please fill out this field",
	}),
});

export type WaitListFormValues = z.infer<typeof waitListFormSchema>;

export type WaitListOptionsRes = {
	success: boolean;
	data: {
		[key: string]: string[];
	};
};

export const UpdateStageSchema = z.object({
	ids: z.array(z.string()),
	stage: z.string(),
});

export type UpdateStageSchemaType = z.infer<typeof UpdateStageSchema>;

export interface WaitListType extends WaitListFormValues {
	_id: string;
	batch: string;
	stage: string;
	id: string;
	__v: number;
	createdAt: string;
}

export interface WaitListRes extends SuccessRes {
	data: WaitListType[];
}

type ToastCtx = { toastId?: string | number };

// --- Worker functions ---
export async function createWaitListApplicantFn(data: WaitListFormValues) {
	return (await axios.post(`${API_URL}/api/applicant/`, data)).data as SuccessRes;
}

export async function deleteWaitListApplicantFn(id: string) {
	return (await axios.delete(`${API_URL}/api/applicant/${id}`)).data as SuccessRes;
}

export async function getWaitListFn(params?: { page?: number; limit?: number }) {
	const page = params?.page ?? 1;
	const limit = params?.limit ?? 6000;
	return (
		await axios.get(`${API_URL}/api/applicant?limit=${limit}&page=${page}`)
	).data as WaitListRes;
}

export async function getWaitListOptionsFn() {
	return (
		await axios.get(`${API_URL}/api/applicant/wait-list/option`)
	).data as WaitListOptionsRes;
}

export async function getWaitListServerSideFn(body: unknown) {
	return (await axios.post(`${API_URL}/api/applicant/wait-list`, body)).data as WaitListRes;
}

export async function updateWaitListStageFn(data: UpdateStageSchemaType) {
	return (await axios.put(`${API_URL}/api/applicant/stage`, data)).data as SuccessRes;
}

export async function createTraineeByWaitlistIdFn(id: string) {
	// Endpoint kept aligned with the code you provided.
	return (
		await axios.post(`${API_URL}/api/applicant/applicants/${id}/register`)
	).data as SuccessRes;
}

const WaitListApi = {
	CreateTraineeByWaitlistId: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				string,
				ToastCtx
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createTraineeByWaitlistIdFn,
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["Waitlist"] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Something went wrong");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Create: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				WaitListFormValues,
				ToastCtx
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createWaitListApplicantFn,
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["Waitlist"] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Something went wrong");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Delete: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string, ToastCtx>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deleteWaitListApplicantFn,
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Deleted successfully");
					queryClient.invalidateQueries({ queryKey: ["Waitlist"] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Something went wrong");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	Get: {
		useQuery: (
			params?: { page?: number; limit?: number },
			options?: UseQueryOptions<WaitListRes, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["Waitlist", params?.page ?? 1, params?.limit ?? 6000],
				queryFn: () => getWaitListFn(params),
				...options,
			}),
	},

	UpdateStage: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				UpdateStageSchemaType,
				ToastCtx
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: updateWaitListStageFn,
				onMutate: async () => {
					return { toastId: toast.loading("Please wait") };
				},
				onSuccess: (res, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.success(res.message || "Successfully updated stage");
					queryClient.invalidateQueries({ queryKey: ["Waitlist"] });
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					if (context?.toastId) toast.dismiss(context.toastId);
					toast.error(err.response?.data?.message || "Something went wrong");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			});
		},
	},

	GetServerSide: {
		useQuery: (
			body: unknown,
			options?: UseQueryOptions<WaitListRes, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["Waitlist", "server", body],
				queryFn: () => getWaitListServerSideFn(body),
				...options,
			}),
	},

	GetOptions: {
		useQuery: (options?: UseQueryOptions<WaitListOptionsRes, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["Waitlist", "options"],
				queryFn: getWaitListOptionsFn,
				...options,
			}),
	},
};

export default WaitListApi;

