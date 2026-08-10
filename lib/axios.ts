import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import useAuthStore from '@/store/useAuthStore' // 1. Import your memory store

export { AxiosError } from 'axios'
export default axios

export const SUPPRESS_AUTO_LOGOUT_HEADER = "X-Suppress-Auto-Logout";

function getRequestHeader(
	config: InternalAxiosRequestConfig,
	name: string
): unknown {
	const headers = config.headers;
	if (!headers) return undefined;

	if (typeof headers.get === "function") {
		return headers.get(name);
	}

	return (headers as Record<string, unknown>)[name];
}

function isTruthyHeader(value: unknown): boolean {
	return value === true || value === "true" || value === "1";
}

function isPublicAuthRequest(url: string): boolean {
	return /\/api\/auth-(admin|trannie)\/(login|register|forgotPassword|resetPassword|activate)/i.test(
		url
	);
}

function isCriticalAuthRequest(url: string, method: string): boolean {
	const m = method.toLowerCase();
	if (m !== "get" && m !== "head") return false;

	return (
		url.includes("/api/auth-admin/refresh") ||
		url.includes("/api/auth-admin/get")
	);
}

function isBackgroundPollingRequest(config: InternalAxiosRequestConfig): boolean {
	if (isTruthyHeader(getRequestHeader(config, SUPPRESS_AUTO_LOGOUT_HEADER))) {
		return true;
	}

	const url = String(config.url ?? "");
	const method = (config.method ?? "get").toLowerCase();

	return method === "get" && /\/api\/support\/tickets\/?(\?|$)/.test(url);
}

function shouldAutoLogoutOn401(error: AxiosError): boolean {
	const config = error.config;
	if (!config) return false;

	if (isBackgroundPollingRequest(config)) return false;

	const url = String(config.url ?? "");
	const method = (config.method ?? "get").toLowerCase();

	if (isPublicAuthRequest(url)) return false;
	if (isCriticalAuthRequest(url, method)) return true;

	if (method !== "get" && method !== "head") return true;

	return true;
}

export function AxiosConfig(logOut: () => void) {
  const url = process.env.NEXT_PUBLIC_BASE_URL || "https://api.share.com.et"
  axios.defaults.baseURL = url

  const requestInterceptorId = axios.interceptors.request.use((config) => {
    const { accessToken, role, permissions } = useAuthStore.getState();

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    if (role) {
      const normalizedRole = String(role).trim().toUpperCase();
      const p = (permissions ?? []).map((x) => String(x).toLowerCase().trim());
      const isTrainingOnlyAdmin =
        normalizedRole === "ADMIN" &&
        !p.includes("all_access") &&
        !p.some((x) => x.startsWith("admin.")) &&
        !p.some((x) => x.startsWith("admin:")) &&
        p.some(
          (x) =>
            x.startsWith("trainee.") ||
            x.startsWith("trainee:") ||
            x.startsWith("training.") ||
            x.startsWith("training:") ||
            x.startsWith("coordinator.") ||
            x.startsWith("coordinator:")
        );

      const requestUrl = String(config.url ?? "");
      const isTrainingCoordinatorApi =
        requestUrl.includes("/api/training-session") ||
        requestUrl.includes("/api/trannie/coordinator-trainees");

      const roleHeader =
        isTrainingOnlyAdmin && isTrainingCoordinatorApi
          ? "COORDINATOR"
          : normalizedRole;

      config.headers["role"] = roleHeader;
    }

    const m = (config.method ?? "get").toLowerCase();
    if (m === "get" || m === "head") {
      config.headers["Cache-Control"] = "no-cache";
      config.headers["Pragma"] = "no-cache";
    }

    // FormData must keep the browser-set multipart boundary; forcing JSON empties files as `{}`.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  });

  const responseInterceptorId = axios.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // 401: invalid/expired session — sign out when session-critical or user-initiated.
      // Background polls and X-Suppress-Auto-Logout requests reject without redirecting.
      if (error.response?.status === 401 && shouldAutoLogoutOn401(error)) {
        logOut();
      }

      return Promise.reject(error);
    }
  );

  return () => {
    axios.interceptors.request.eject(requestInterceptorId)
    axios.interceptors.response.eject(responseInterceptorId)
  }
}
