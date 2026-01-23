import type { ReactNode } from "react";
import { DashboardShell } from "./dash-board";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}