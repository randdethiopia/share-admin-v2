import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminCardProps = {
  children: ReactNode;
  className?: string;
};

export function AdminCard({ children, className }: AdminCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
