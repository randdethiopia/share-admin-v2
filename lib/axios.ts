import axios from 'axios'
import Cookies from 'js-cookie'
import useAuthStore from '@/store/useAuthStore' // 1. Import your memory store

export default function AxiosConfig(logOut: () => void) {
  const url = process.env.NEXT_PUBLIC_BASE_URL || "https://api.share.com.et"
  axios.defaults.baseURL = url

  // THE REQUEST INTERCEPTOR: The "Automatic Security Check"
  const requestInterceptorId = axios.interceptors.request.use((config) => {
    // 2. GET THE KEYS: Grab token from cookie and role from Zustand
    const token = Cookies.get("session_token");
    const { role, permissions } = useAuthStore.getState();

    // 3. STAMP THE HEADERS: Attach the badge to the request
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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

      config.headers['role'] = roleHeader;
    }

    // Avoid browser HTTP caching / 304 + If-None-Match reusing a stale body for API GETs
    // (e.g. different query string but buggy cache key, or dev tools confusion).
    const m = (config.method ?? "get").toLowerCase();
    if (m === "get" || m === "head") {
      config.headers["Cache-Control"] = "no-cache";
      config.headers["Pragma"] = "no-cache";
    }

    config.headers['ngrok-skip-browser-warning'] = 'true';
    config.headers['Content-Type'] = 'application/json';
    
    return config;
  });

  // THE RESPONSE INTERCEPTOR: The "Logout Guard"
  const responseInterceptorId = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // 401: invalid/expired session — sign out. 403: forbidden resource — let callers show UI.
      if (error.response?.status === 401) {
        logOut();
      }
      return Promise.reject(error);
    }
  );

  // Return cleanup so interceptors don't stack (dev StrictMode, route changes, HMR)
  return () => {
    axios.interceptors.request.eject(requestInterceptorId)
    axios.interceptors.response.eject(responseInterceptorId)
  }
}