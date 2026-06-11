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



export type ApplicantCityRef = {
	_id: string;
	name: string;
	slug: string;
	isActive: boolean;
	hasSubCity: boolean;
};

export type ApplicantSubCityRef = {
	_id: string;
	name: string;
	slug: string;
	isActive: boolean;
};

export type ApplicantGender = "male" | "female";

export type ApplicantMaritalStatus = "SGL" | "MRD" | "DIV" | "WID" | "PNS";

export type ApplicantYesNo = "yes" | "no";

export type ApplicantDisabilityType =
	| "IPD"
	| "LDI"
	| "SPI"
	| "PHD"
	| "HI"
	| "VI";

export type ApplicantDigitalDevice = "SP" | "TAB" | "LAP";

export type ApplicantEducationalBackground =
	| "NFE"
	| "PS"
	| "MS"
	| "SS"
	| "VTT"
	| "VTD"
	| "CUD"
	| "CUB"
	| "CUM"
	| "CUDR"
	| "PC";

export type ApplicantEmploymentStatus =
	| "EFT"
	| "EPT"
	| "SE"
	| "UNE"
	| "STU"
	| "OTH";

export type ApplicantMonthlyEarnings =
	| "0-1000"
	| "1001-3000"
	| "3001-5000"
	| "5001-10000"
	| "10001-20000"
	| "20000+"
	| "Prefer not to say";

export type ApplicantWeeklyCommitment =
	| "1-5"
	| "6-10"
	| "11-20"
	| "21-30"
	| "30+";

export type ApplicantSkillLevel =
	| "Beginner"
	| "Intermediate"
	| "Advanced"
	| "Expert";

export type ApplicantLanguageProficiency =
	| "Basic"
	| "Intermediate"
	| "Advanced"
	| "Native";

export type ApplicantHumanitarianStatus =
	| "Refugee"
	| "Asylum Seeker"
	| "Internally Displaced Person (IDP)"
	| "Returnee"
	| "None";

export type ApplicantListItem = {
	_id: string;
	firstName: string;
	middleName?: string;
	lastName?: string;
	phoneNumber: string;
	birthDate: string;
	email?: string;
	age: number;
	gender: ApplicantGender;
	maritalStatus: ApplicantMaritalStatus;
	hasDisability: ApplicantYesNo;
	disabilityType?: ApplicantDisabilityType;
	digitalDevices: ApplicantDigitalDevice[];
	educationalBackground: ApplicantEducationalBackground;
	studySubject: string;
	region: string;
	city: ApplicantCityRef;
	subcity?: ApplicantSubCityRef | null;
	woreda: string;
	zone: string;
	employmentStatus: ApplicantEmploymentStatus;
	previousEmploymentStatus: ApplicantEmploymentStatus;
	monthlyEarnings: ApplicantMonthlyEarnings;
	batch?: string;
	stage?: string;
	weeklyCommitment: ApplicantWeeklyCommitment;
	technicalDigitalSkills: ApplicantSkillLevel;
	englishProficiency: ApplicantLanguageProficiency;
	amharicProficiency: ApplicantLanguageProficiency;
	participatedMasterCardFundedProgram: ApplicantYesNo;
	acceptsSafeguardingConducts: ApplicantYesNo;
	humanitarianStatus: ApplicantHumanitarianStatus;
	alreadyOnEdge?: boolean;
	createdAt: string;
	updatedAt: string;
};

export type GetApplicantsResponseMeta = {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
};

export type GetApplicantsResponse = {
	data: ApplicantListItem[];
	meta: GetApplicantsResponseMeta;
};

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

const applicantMaritalStatusSchema = z.enum(["SGL", "MRD", "DIV", "WID", "PNS"]);
const applicantYesNoSchema = z.enum(["yes", "no"]);
const applicantDisabilityTypeSchema = z.enum([
	"IPD",
	"LDI",
	"SPI",
	"PHD",
	"HI",
	"VI",
]);
const applicantDigitalDeviceSchema = z.enum(["SP", "TAB", "LAP"]);
const applicantEducationalBackgroundSchema = z.enum([
	"NFE",
	"PS",
	"MS",
	"SS",
	"VTT",
	"VTD",
	"CUD",
	"CUB",
	"CUM",
	"CUDR",
	"PC",
]);
const applicantEmploymentStatusSchema = z.enum([
	"EFT",
	"EPT",
	"SE",
	"UNE",
	"STU",
	"OTH",
]);
const applicantMonthlyEarningsSchema = z.enum([
	"0-1000",
	"1001-3000",
	"3001-5000",
	"5001-10000",
	"10001-20000",
	"20000+",
	"Prefer not to say",
]);
const applicantWeeklyCommitmentSchema = z.enum([
	"1-5",
	"6-10",
	"11-20",
	"21-30",
	"30+",
]);
const applicantSkillLevelSchema = z.enum([
	"Beginner",
	"Intermediate",
	"Advanced",
	"Expert",
]);
const applicantLanguageProficiencySchema = z.enum([
	"Basic",
	"Intermediate",
	"Advanced",
	"Native",
]);
const applicantHumanitarianStatusSchema = z.enum([
	"Refugee",
	"Asylum Seeker",
	"Internally Displaced Person (IDP)",
	"Returnee",
	"None",
]);

export const applicantCreateSchema = z
	.object({
		firstName: z
			.string()
			.trim()
			.min(2, { message: "First name must be at least 2 characters." }),
		middleName: z
			.string()
			.trim()
			.min(2, { message: "Father's name must be at least 2 characters." }),
		lastName: z
			.string()
			.trim()
			.min(2, { message: "Grandfather's name must be at least 2 characters." }),
		phoneNumber: z
			.string()
			.regex(/^0\d{9}$/, {
				message: "Phone number must be 10 digits starting with 0.",
			}),
		birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
			message: "Birth date must be in YYYY-MM-DD format.",
		}),
		age: z.coerce
			.number()
			.int()
			.min(18, { message: "You must be at least 18 years old." })
			.max(120),
		email: z.union([z.string().email(), z.literal("")]).optional(),
		gender: z.enum(["male", "female"] as const, {
			message: "Please select your gender.",
		}),
		region: z.string().min(1, { message: "Region is required." }),
		city: z.string().optional(),
		subcity: z.string().optional(),
		woreda: z.string().min(1, { message: "Woreda is required." }),
		zone: z.string().min(1, { message: "Zone is required." }),
		maritalStatus: applicantMaritalStatusSchema,
		hasDisability: applicantYesNoSchema,
		disabilityType: applicantDisabilityTypeSchema.optional(),
		humanitarianStatus: applicantHumanitarianStatusSchema,
		digitalDevices: z
			.array(applicantDigitalDeviceSchema)
			.min(1, { message: "Select at least one digital device." }),
		educationalBackground: applicantEducationalBackgroundSchema,
		studySubject: z.string().default("none"),
		employmentStatus: applicantEmploymentStatusSchema,
		previousEmploymentStatus: applicantEmploymentStatusSchema,
		monthlyEarnings: applicantMonthlyEarningsSchema,
		weeklyCommitment: applicantWeeklyCommitmentSchema,
		technicalDigitalSkills: applicantSkillLevelSchema,
		englishProficiency: applicantLanguageProficiencySchema,
		amharicProficiency: applicantLanguageProficiencySchema,
		participatedMasterCardFundedProgram: applicantYesNoSchema,
		acceptsSafeguardingConducts: applicantYesNoSchema,
	})
	.superRefine((data, ctx) => {
		if (data.hasDisability === "yes" && !data.disabilityType) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["disabilityType"],
				message: "Disability type is required when has disability is yes.",
			});
		}
	});

export type ApplicantCreateRequest = z.infer<typeof applicantCreateSchema>;

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

type ToastCtx = { toastId?: string | number };

function markWaitlistApplicantOnEdge(
	queryClient: ReturnType<typeof useQueryClient>,
	applicantId: string
) {
	queryClient.setQueriesData<GetApplicantsResponse>(
		{ queryKey: ["Waitlist"] },
		(old) => {
			if (!old?.data) return old;

			return {
				...old,
				data: old.data.map((applicant) =>
					applicant._id === applicantId
						? { ...applicant, alreadyOnEdge: true }
						: applicant
				),
			};
		}
	);
}

// --- Worker functions ---
export async function createWaitListApplicantFn(data: ApplicantCreateRequest) {
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
	).data as GetApplicantsResponse;
}

export async function getWaitListOptionsFn() {
	return (
		await axios.get(`${API_URL}/api/applicant/wait-list/option`)
	).data as WaitListOptionsRes;
}

export async function getWaitListServerSideFn(body: unknown) {
	return (await axios.post(`${API_URL}/api/applicant/wait-list`, body))
		.data as GetApplicantsResponse;
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
					markWaitlistApplicantOnEdge(queryClient, variables);
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
				ApplicantCreateRequest,
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
			options?: UseQueryOptions<GetApplicantsResponse, AxiosError<ErrorRes>>
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
			options?: UseQueryOptions<GetApplicantsResponse, AxiosError<ErrorRes>>
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

