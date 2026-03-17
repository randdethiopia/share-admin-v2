import type { ReactNode } from "react";
import { DashboardShell } from "./dash-board";
import { DashboardPermissionGate } from "@/components/shared/dashboard-permission-gate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <DashboardPermissionGate>{children}</DashboardPermissionGate>
    </DashboardShell>
  );
}