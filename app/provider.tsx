"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import AxiosConfig from "@/lib/axios";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import Cookies from "js-cookie";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Avoid refetching on every tab focus; makes UI feel "slow".
            refetchOnWindowFocus: false,
            // Keep results fresh for a bit; reduces redundant network calls.
            staleTime: 30_000,
            // Keep cached data around to make back/forward navigation instant.
            gcTime: 5 * 60_000,
            retry: 1,
          },
        },
      })
  );
  const router = useRouter();
  const { logOut } = useAuthStore();

  React.useEffect(() => {
    // Initialize Axios Interceptors
    const cleanup = AxiosConfig(() => {
      // SignOut Callback
      logOut();
      Cookies.remove("session_token");
      router.push("/login"); // Redirect to login on 401/403
    });

    return () => {
      cleanup?.();
    };
  }, [logOut, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
