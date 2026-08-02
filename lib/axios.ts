import axios from "axios";
import { toast } from "sonner";
import useAuthStore from "@/store/useAuthStore";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  isAuthSessionEndpoint,
  refreshAccessToken,
  shouldAttemptTokenRefresh,
  signOut,
} from "@/lib/auth-session";

export default function AxiosConfig() {
  const url = process.env.NEXT_PUBLIC_BASE_URL || "https://api.share.com.et";
  axios.defaults.baseURL = url;

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

    config.headers["ngrok-skip-browser-warning"] = "true";

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  });

  const responseInterceptorId = axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const status = error.response?.status as number | undefined;
      const backendMessage = error.response?.data?.message as string | undefined;

      if (
        !original ||
        original.skipAuthRefresh ||
        isAuthSessionEndpoint(original.url)
      ) {
        return Promise.reject(error);
      }

      if (!original._retry && shouldAttemptTokenRefresh(status)) {
        original._retry = true;
        try {
          await refreshAccessToken();
          const token = useAuthStore.getState().accessToken;
          if (token) {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
          }
          return axios(original);
        } catch {
          toast.error(getApiErrorMessage(401), {
            id: "auth-unauthorized",
          });
          void signOut();
          return Promise.reject(error);
        }
      }

      if (status === 401) {
        toast.error(getApiErrorMessage(401, backendMessage), {
          id: "auth-unauthorized",
        });
        void signOut();
      } else if (status === 403) {
        toast.error(getApiErrorMessage(403, backendMessage), {
          id: "auth-forbidden",
        });
      }

      return Promise.reject(error);
    }
  );

  return () => {
    axios.interceptors.request.eject(requestInterceptorId);
    axios.interceptors.response.eject(responseInterceptorId);
  };
}
