import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilterFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function FilterField({ label, children, className }: FilterFieldProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </div>
  );
}
