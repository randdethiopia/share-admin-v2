"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import AxiosConfig from "@/lib/axios";
import useAuthStore from "@/store/useAuthStore";

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
  const logOut = useAuthStore((s) => s.logOut);

  React.useEffect(() => {
    const cleanup = AxiosConfig(logOut);

    return () => {
      cleanup?.();
    };
  }, [logOut]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
