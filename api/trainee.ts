import useAuthStore from "@/store/useAuthStore";
import { ErrorRes, Roles, SuccessRes } from "@/types/core";
import {
	UseMutationOptions,
	UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export interface TraineeType {
	_id: string;
	type: string;
	referralCode: string;
	createdAt: string;
	username: string;
	idnumber: string;
	auth: string;
	firstname: string;
	lastname: string;
	lang: string;
	calendartype: string;
	password: string;
	phoneNumber: string;
	isActive: boolean;
	email: string;
	role: Roles;
	__v: number;
	age?: string;
	region?: string;
	gender?: string;
	education?: string;
}

export interface TraineeLoginSuccessResType extends SuccessRes {
	user: TraineeType;
	accessToken: string;
}

export interface TraineeResType {
	data: TraineeType[];
	meta: {
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
	};
}

export interface TraineeRegistrationType {
	firstname: string;
	lastname: string;
	email: string;
	phoneNumber: string;
}

export interface TraineeRegistrationResType extends SuccessRes {
	email: string;
}

export interface TraineeLogin {
	email: string;
	password: string;
}

export interface ChangePasswordType {
	oldPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export interface ForgotPasswordType {
	email: string;
}

export interface ResetPasswordType {
	email: string;
	passwordResetCode: string;
	password: string;
	confirmPassword: string;
}

export interface VerificationReqType {
	email: string;
	verificationCode: string;
}

// --- Worker functions ---
export async function bulkRegisterTraineeFn(files: FormData) {
	return (
		await axios.post(`${API_URL}/api/auth-trannie/import`, files, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		})
	).data as { summary: unknown[]; success: boolean };
}

export async function registerTraineeFn(traineeAuth: TraineeRegistrationType) {
	return (
		await axios.post(`${API_URL}/api/auth-trannie/aregister`, traineeAuth)
	).data as TraineeRegistrationResType;
}

export async function getAllTraineeFn(
	page: number,
	limit: number,
	type?: string,
	search?: string,
	status?: string
) {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
	});

	if (type) params.set("type", type);
	if (search) params.set("search", search);
	if (status) params.set("status", status);

	return (
		await axios.get(`${API_URL}/api/trannie/get?${params.toString()}`)
	).data as TraineeResType;
}

export async function showTraineeFn(id: string) {
	return (await axios.get(`${API_URL}/api/trannie/show/${id}`)).data as TraineeType;
}

export async function activateTraineeFn(email: string, verificationCode: string) {
	return (
		await axios.post(`${API_URL}/api/auth-trannie/activate`, {
			email,
			verificationCode,
		})
	).data as SuccessRes;
}

export async function loginTraineeFn(traineeLogin: TraineeLogin) {
	return (
		await axios.post(`${API_URL}/api/auth-trannie/login`, traineeLogin)
	).data as TraineeLoginSuccessResType;
}

export async function changeTraineePasswordFn(changePassword: ChangePasswordType) {
	return (
		await axios.patch(`${API_URL}/api/auth-trannie/change`, changePassword)
	).data as SuccessRes;
}

export async function forgotTraineePasswordFn(forgotPassword: ForgotPasswordType) {
	return (
		await axios.post(`${API_URL}/api/auth-trannie/forgotPassword`, forgotPassword)
	).data as SuccessRes;
}

export async function resetTraineePasswordFn(resetPassword: ResetPasswordType) {
	return (
		await axios.post(`${API_URL}/api/auth-trannie/resetPassword`, resetPassword)
	).data as SuccessRes;
}

export async function refreshTraineeTokenFn() {
	return (
		await axios.get(`${API_URL}/api/auth-trannie/refresh`, {
			withCredentials: true,
		})
	).data as SuccessRes;
}

export async function deleteTraineeFn(id: string) {
	return (await axios.delete(`${API_URL}/api/trannie/delete/${id}`)).data as SuccessRes;
}

const TraineeAuth = {
	bulkRegisterTrainee: {
		useMutation: (
			options?: UseMutationOptions<
				{ summary: unknown[]; success: boolean },
				AxiosError<ErrorRes>,
				FormData
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: bulkRegisterTraineeFn,
				onSuccess: (res, variables, context) => {
					toast.success(
						`${res.summary?.length ?? 0} Trainee(s) imported successfully`
					);
					queryClient.invalidateQueries({ queryKey: ["Trainee"] });
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

	registerTrainee: {
		useMutation: (
			options?: UseMutationOptions<
				TraineeRegistrationResType,
				AxiosError<ErrorRes>,
				TraineeRegistrationType
			>
		) =>
			useMutation({
				mutationFn: registerTraineeFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Registered successfully");
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			}),
	},

	activateTrainee: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, VerificationReqType>
		) =>
			useMutation({
				mutationFn: ({ email, verificationCode }) =>
					activateTraineeFn(email, verificationCode),
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Activated");
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			}),
	},

	loginTrainee: {
		useMutation: (
			options?: UseMutationOptions<
				TraineeLoginSuccessResType,
				AxiosError<ErrorRes>,
				TraineeLogin
			>
		) =>
			useMutation({
				mutationFn: loginTraineeFn,
				onSuccess: (res, variables, context) => {
					useAuthStore
						.getState()
						.setAccessToken(res.user._id, res.accessToken, res.user.role as Roles);

					// Needed for `middleware.ts` route protection (same pattern as admin login).
					Cookies.set("session_token", res.accessToken, { expires: 7 });

					toast.success(res.message || "Logged in");
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			}),
	},

	changePassword: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, ChangePasswordType>
		) =>
			useMutation({
				mutationFn: changeTraineePasswordFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Password changed");
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			}),
	},

	forgotPassword: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, ForgotPasswordType>
		) =>
			useMutation({
				mutationFn: forgotTraineePasswordFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Check your email");
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			}),
	},

	resetPassword: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, ResetPasswordType>
		) =>
			useMutation({
				mutationFn: resetTraineePasswordFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Password reset");
					options?.onSuccess?.(res, variables, context, undefined as unknown as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as unknown as never);
				},
				...options,
			}),
	},

	refreshTraineeToken: {
		useQuery: (options?: UseQueryOptions<SuccessRes, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["TraineeAuth", "refreshTraineeToken"],
				queryFn: refreshTraineeTokenFn,
				...options,
			}),
	},

	GetTrainee: {
		useQuery: (
			page: number,
			limit: number,
			type?: string,
			search?: string,
			status?: string,
			options?: UseQueryOptions<TraineeResType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["Trainee", page, limit, type ?? "", search ?? "", status ?? ""],
				queryFn: () => getAllTraineeFn(page, limit, type, search, status),
				...options,
			}),
	},

	GetTraineeById: {
		useQuery: (id: string, options?: UseQueryOptions<TraineeType, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["Trainee", id],
				queryFn: () => showTraineeFn(id),
				enabled: Boolean(id) && (options?.enabled ?? true),
				...options,
			}),
	},

	DeleteTrainee: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: deleteTraineeFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Deleted");
					queryClient.invalidateQueries({ queryKey: ["Trainee"] });
					queryClient.invalidateQueries({ queryKey: ["Trainee", id] });
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

export default TraineeAuth;
