import axios from 'axios'
import Cookies from 'js-cookie'
import useAuthStore from '@/store/useAuthStore' // 1. Import your memory store

export default function AxiosConfig(signOut: () => void) {
  const url = process.env.NEXT_PUBLIC_BASE_URL || "https://api.share.com.et"
  axios.defaults.baseURL = url

  // THE REQUEST INTERCEPTOR: The "Automatic Security Check"
  const requestInterceptorId = axios.interceptors.request.use((config) => {
    // 2. GET THE KEYS: Grab token from cookie and role from Zustand
    const token = Cookies.get("session_token");
    const role = useAuthStore.getState().role;

    // 3. STAMP THE HEADERS: Attach the badge to the request
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (role) {
      // FIX: This sends the 'role' header so the server doesn't crash
      config.headers['role'] = role; 
    }

    config.headers['ngrok-skip-browser-warning'] = 'true';
    config.headers['Content-Type'] = 'application/json';
    
    return config;
  });

  // THE RESPONSE INTERCEPTOR: The "Logout Guard"
  const responseInterceptorId = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // If the server says you are no longer welcome (401/403)
      if (error.response?.status === 403 || error.response?.status === 401) {
        signOut(); 
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