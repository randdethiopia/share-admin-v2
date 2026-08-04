"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { refreshAccessToken } from "@/lib/auth-session";

const PUBLIC_PATHS = [
  "/login",
  "/signUp",
  "/forgot-password",
  "/reset-password",
];

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

function isPublicPath(pathname: string) {
  const path = pathname.toLowerCase();
  if (path === "/") return true;
  return PUBLIC_PATHS.some((route) => {
    const r = route.toLowerCase();
    return path === r || path.startsWith(`${r}/`);
  });
}

function isAuthFormPath(pathname: string) {
  const path = pathname.toLowerCase();
  return PUBLIC_PATHS.some((route) => {
    const r = route.toLowerCase();
    return path === r || path.startsWith(`${r}/`);
  });
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [ready, setReady] = React.useState(false);
  const landingPathRef = React.useRef(pathname);

  const isPublic = isPublicPath(pathname);
  const onAuthForm = isAuthFormPath(pathname);

  React.useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;
    const landingPath = landingPathRef.current;

    async function restore() {
      if (useAuthStore.getState().accessToken) {
        if (!cancelled) setReady(true);
        return;
      }

      if (isAuthFormPath(landingPath)) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        await refreshAccessToken();
      } catch {
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated]);

  React.useEffect(() => {
    if (!hasHydrated || !ready) return;

    if (accessToken && onAuthForm) {
      router.replace(DASHBOARD_PATH);
      return;
    }

    if (!accessToken && !isPublic) {
      router.replace(LOGIN_PATH);
    }
  }, [hasHydrated, ready, accessToken, onAuthForm, isPublic, router]);

  if (!hasHydrated || (!ready && !isPublic)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if ((accessToken && onAuthForm) || (!accessToken && !isPublic)) {
    return null;
  }

  return children;
}
