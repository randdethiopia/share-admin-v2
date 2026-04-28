"use client";

import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { hasPermission } from "@/lib/permission";
import useAuthStore from "@/store/useAuthStore";

type Action = "read" | "write";

type MatchRule = {
  prefixes: string[];
  resource: string;
};

const RULES: MatchRule[] = [
  { prefixes: ["/dashboard"], resource: "dashboard" },
  { prefixes: ["/projects"], resource: "project" },
  { prefixes: ["/invitations"], resource: "invitation" },
  { prefixes: ["/blogs"], resource: "blog" },
  { prefixes: ["/expert", "/advisor-profile"], resource: "advisor" },
  { prefixes: ["/business", "/businesses"], resource: "business" },
  { prefixes: ["/mentor", "/investor-profile"], resource: "investor" },
  { prefixes: ["/jobs"], resource: "job" },
  { prefixes: ["/trainee"], resource: "trainee" },
  { prefixes: ["/resource"], resource: "resource" },
];

function getMatch(pathname: string): MatchRule | null {
  return RULES.find((rule) => rule.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) ?? null;
}

function resolveAction(pathname: string): Action {
  if (pathname.includes("/new") || pathname.includes("/create") || pathname.includes("/edit") || pathname.includes("/reinvest")) {
    return "write";
  }
  return "read";
}

export function DashboardPermissionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const permissionKey = useMemo(() => {
    const match = getMatch(pathname);
    if (!match) return null;
    const action = resolveAction(pathname);
    return `${match.resource}:${action}`;
  }, [pathname]);

  if (!hasHydrated) {
    return <div className="min-h-[40vh]" />;
  }

  if (permissionKey && !hasPermission(permissionKey)) {
    return (
      <div className="min-h-screen bg-[#E2EDF8] p-8">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
