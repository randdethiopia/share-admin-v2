import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  category?: string;
  title: string;
  description?: string;
  className?: string;
  actions?: ReactNode;
};

export function PageHeader({
  category,
  title,
  description,
  className,
  actions,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 border-l-4 border-primary py-0.5 pl-4", className)}>
      {category ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
          {category}
        </p>
      ) : null}
      <div
        className={cn(
          actions && "flex items-start justify-between gap-4",
        )}
      >
        <div>
          <h1 className="text-2xl font-bold text-agar-navy">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
    </div>
  );
}
