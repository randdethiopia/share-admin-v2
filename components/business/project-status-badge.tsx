import type { ProjectStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const PROJECT_STATUS_CONFIG: Record<
	ProjectStatus,
	{ label: string; className: string }
> = {
	APPROVED: {
		label: "APPROVED",
		className: "bg-emerald-50 text-emerald-700",
	},
	PENDING: {
		label: "PENDING",
		className: "bg-amber-50 text-amber-700",
	},
	REJECTED: {
		label: "REJECTED",
		className: "bg-red-50 text-red-700",
	},
	DRAFT: {
		label: "DRAFT",
		className: "bg-slate-100 text-slate-600",
	},
};

const PROJECT_STATUS_VALUES = new Set<string>(Object.keys(PROJECT_STATUS_CONFIG));

function isProjectStatus(value: string): value is ProjectStatus {
	return PROJECT_STATUS_VALUES.has(value);
}

type ProjectStatusBadgeProps = {
	status: ProjectStatus | string;
	className?: string;
};

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
	const normalized = (status ?? "").trim().toUpperCase();

	if (isProjectStatus(normalized)) {
		const config = PROJECT_STATUS_CONFIG[normalized];
		return (
			<span
				className={cn(
					"inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase",
					config.className,
					className,
				)}
			>
				● {config.label}
			</span>
		);
	}

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground",
				className,
			)}
		>
			● {normalized || "UNKNOWN"}
		</span>
	);
}
