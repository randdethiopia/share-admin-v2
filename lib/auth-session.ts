import axios from "axios";
import useAuthStore from "@/store/useAuthStore";
import type { AdminLoginSuccessResType } from "@/lib/api/admin";

export type AdminRefreshSuccessRes = AdminLoginSuccessResType;

const AUTH_ADMIN_PREFIX = "/api/auth-admin";
const API_BASE =
  process.env.NEXT_PUBLIC_BASE_URL || "https://api.share.com.et";

if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = API_BASE;
}

let refreshInFlight: Promise<AdminRefreshSuccessRes> | null = null;

export function isAuthSessionEndpoint(url: string | undefined): boolean {
  const path = String(url ?? "");
  return (
    path.includes(`${AUTH_ADMIN_PREFIX}/login`) ||
    path.includes(`${AUTH_ADMIN_PREFIX}/refresh`) ||
    path.includes(`${AUTH_ADMIN_PREFIX}/logout`)
  );
}

export function shouldAttemptTokenRefresh(status: number | undefined): boolean {
  return status === 401;
}

export function refreshAccessToken(): Promise<AdminRefreshSuccessRes> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = axios
    .get<AdminRefreshSuccessRes>(`${AUTH_ADMIN_PREFIX}/refresh`, {
      withCredentials: true,
      skipAuthRefresh: true,
    })
    .then((res) => {
      const { accessToken, permissions, user } = res.data;
      if (!accessToken || !user?._id) {
        throw new Error("Refresh response missing accessToken or user");
      }
      useAuthStore.getState().setAccessToken(
        user._id,
        accessToken,
        user.role,
        user.email,
        permissions ?? user.permissions ?? null,
        user
      );
      return res.data;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export async function logoutSession(): Promise<void> {
  try {
    await axios.get(`${AUTH_ADMIN_PREFIX}/logout`, {
      withCredentials: true,
      skipAuthRefresh: true,
    });
  } catch {
  }
}

let signOutInFlight: Promise<void> | null = null;

export function signOut(): Promise<void> {
  if (signOutInFlight) return signOutInFlight;

  signOutInFlight = (async () => {
    try {
      await logoutSession();
    } finally {
      useAuthStore.getState().logOut();
    }
  })();

  return signOutInFlight;
}
