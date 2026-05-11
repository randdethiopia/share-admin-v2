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
    const onErr = (ev: ErrorEvent) => {
      // #region agent log
      fetch("http://127.0.0.1:7927/ingest/a23c4bcb-cbdd-4775-a08e-248d4269e29b", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "646340",
        },
        body: JSON.stringify({
          sessionId: "646340",
          location: "app/provider.tsx:window-error",
          message: "window error event",
          data: {
            msg: String(ev.message ?? ""),
            lineno: ev.lineno ?? null,
            colno: ev.colno ?? null,
          },
          timestamp: Date.now(),
          hypothesisId: "H1",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
    };
    window.addEventListener("error", onErr);
    return () => window.removeEventListener("error", onErr);
  }, []);

  React.useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7927/ingest/a23c4bcb-cbdd-4775-a08e-248d4269e29b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "646340",
      },
      body: JSON.stringify({
        sessionId: "646340",
        location: "app/provider.tsx:axios-setup",
        message: "Providers axios interceptor effect ran",
        data: {},
        timestamp: Date.now(),
        hypothesisId: "H2",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    // Initialize Axios Interceptors
    const cleanup = AxiosConfig(() => {
      // SignOut Callback
      logOut();
      Cookies.remove("session_token");
      router.push("/login"); // Redirect to login on 401
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
