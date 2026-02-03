import useAuthStore from "@/store/useAuthStore";
import { ErrorRes, Roles, SuccessRes } from "@/types/core";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

export interface AdminLoginSuccessResType extends SuccessRes {
  user: {
    _id: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    isActive: boolean;
    email: string,
    role: Roles,
    __v: number;
  };
  accessToken: string,
}
export interface AdminAuthType {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  confirmPassword: string;
}
export interface AdminRegistrationType {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}
export interface AdminRegistrationResType extends SuccessRes {
  phoneNumber: string;
}
export interface AdminLogin {
  phoneNumber: string;
  password: string;
}
export interface ChangePasswordType {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
export interface ForgotPasswordResType {
  phoneNumber: string;
}
export interface ForgotPasswordType {
  phoneNumber: string;
}
export interface ResetPasswordType {
  phoneNumber: string;
  passwordResetCode: string;
  password: string;
  confirmPassword: string;
}
export interface verificationReqType {
  phoneNumber: string;
  verificationCode: string;
}

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function getFn() {
  return (await axios.get(`${API_URL}/api/auth-admin/get`)).data;
}
export async function getByIdFn(id : string ) {
  return (await axios.get(`/auth-admin/show/${id}`)).data;
}
export async function deleteFn(id : string ) {
  return (await axios.delete("/api/auth-admin/" + id)).data;
}
export async function registerAdminFn(AdminAuth: AdminRegistrationType) {
  return (await axios.post("/api/auth-admin/register", AdminAuth)).data;
}
export async function activateAdminFn(
  phoneNumber: string,
  verificationCode: string
) {
  return (
    await axios.post("/api/auth-admin/activate", { phoneNumber, verificationCode })
  ).data;
}
export async function loginAdminFn(AdminLogin: AdminLogin) {
  return (await axios.post(`${API_URL}/api/auth-admin/login`, AdminLogin)).data;
}
export async function changePasswordFn(
  changePassword: ChangePasswordType,
) {
  return (
    await axios.patch(`${API_URL}/api/auth-admin/change`, changePassword)
  ).data;
}
export async function forgotPasswordFn(forgotPassword: ForgotPasswordType) {
  return (await axios.post("/api/auth-admin/forgotPassword", forgotPassword))
    .data;
}
export async function resetPasswordFn(resetPassword: ResetPasswordType) {
  return (await axios.post("/api/auth-admin/resetPassword", resetPassword))
    .data;
}
export async function refreshAdminTokenFn() {
  return (
    await axios.get("/api/auth-admin/refresh", {
      withCredentials: true,  
    })).data;
}





const AdminAuth = {
  Get: {
    useQuery: (
      options?: UseQueryOptions<AdminAuthType[], AxiosError<ErrorRes>>
    ) =>
      useQuery({
        queryKey: ["Admin"],
        queryFn: () => getFn(),
        ...options,
      }),
  },
  GetById: {
    useQuery: (
      id: string ,
      options?: UseQueryOptions<AdminAuthType, AxiosError<ErrorRes>>
    ) =>
      useQuery({
        queryKey: ["Admin", id],
        queryFn: () => getByIdFn(id),
        ...options,
      }),
  },
  Delete: {
    useMutation: (
      options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
    ) =>
      useMutation({
        ...options,
        mutationFn: (data) => deleteFn(data),
      }),
  },
  registerAdmin: {
    useMutation: (
      options?: UseMutationOptions<
        AdminRegistrationResType,
        AxiosError<ErrorRes>,
        AdminRegistrationType
      >
    ) =>
      useMutation({
        ...options,
        mutationFn: (data) => registerAdminFn(data)
      }),
  },
  activateAdmin: {
    useMutation: (
      options?: UseMutationOptions<
        SuccessRes,
        AxiosError<ErrorRes>,
        verificationReqType
      >
    ) =>
      useMutation({
        ...options,
        mutationFn: ({ phoneNumber, verificationCode }) =>
          activateAdminFn(phoneNumber, verificationCode),
      }),
  },
  loginAdmin: {
    useMutation: (
      options?: UseMutationOptions<
      AdminLoginSuccessResType,
        AxiosError<ErrorRes>,
        AdminLogin
      >
    ) =>
      useMutation({
        ...options,
        mutationFn: (AdminLogin) => loginAdminFn(AdminLogin),
        onSuccess: (data, variables, context) => {
          useAuthStore.getState().setAccessToken(
            data.user._id,
            data.accessToken,
            data.user.role
          );

          // Needed for `middleware.ts` route protection.
          Cookies.set("session_token", data.accessToken, { expires: 7 });

          // React Query's callback arity differs slightly by version; forward all args.
          options?.onSuccess?.(data, variables, context, undefined as any);
        },
      }),
  },
  changePassword: {
    useMutation: (
      options?: UseMutationOptions<
        SuccessRes,
        AxiosError<ErrorRes>,
        ChangePasswordType
      >
    ) =>
      useMutation({
        ...options,
        mutationFn: (changePassword) => changePasswordFn(changePassword),
      }),
  },
  forgotPassword: {
    useMutation: (
      options?: UseMutationOptions<
        SuccessRes,
        AxiosError<ErrorRes>,
        ForgotPasswordType
      >
    ) =>
      useMutation({
        ...options,
        mutationFn: (forgotPassword) => forgotPasswordFn(forgotPassword)
      }),
  },
  resetPassword: {
    useMutation: (
      options?: UseMutationOptions<
        SuccessRes,
        AxiosError<ErrorRes>,
        ResetPasswordType
      >
    ) =>
      useMutation({
        ...options,
        mutationFn: (resetPassword) => resetPasswordFn(resetPassword),
      }),
  },
  refreshAdminToken: {
    useQuery: (
      options?: UseQueryOptions<SuccessRes, AxiosError<ErrorRes>>
    ) =>
      useQuery({
        ...options,
        queryKey: ["AdminAuth", "refreshAdminToken"],
        queryFn: () => refreshAdminTokenFn(),
      }),
  },
};

export default AdminAuth;


  