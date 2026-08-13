import Link from "next/link";

import type { BusinessProfileProject } from "@/lib/api";
import { ProjectImage } from "@/components/business/project-image";
import { ProjectStatusBadge } from "@/components/business/project-status-badge";
import {
	formatCurrencyETB,
	getCategoryLabel,
	getFundingProgress,
	stripHtmlSnippet,
} from "@/components/business/project-utils";
import { cn } from "@/lib/utils";

type BusinessProjectCardProps = {
	project: BusinessProfileProject;
	className?: string;
};

export function BusinessProjectCard({
	project,
	className,
}: BusinessProjectCardProps) {
	const description = stripHtmlSnippet(project.description);
	const { target, raised, percent } = getFundingProgress(project);
	const showProgressBar = target > 0;

	const card = (
		<article
			className={cn(
				"flex h-full flex-col space-y-4 rounded-xl border-0 bg-card p-4 shadow-xs text-left",
				className,
			)}
		>
			<ProjectImage project={project} />

			<div className="flex flex-wrap items-center justify-between gap-2">
				<ProjectStatusBadge status={project.status} />
				<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
					{getCategoryLabel(project)}
				</p>
			</div>

			<div className="space-y-2">
				<h3 className="text-base font-semibold text-foreground">
					{project.projectName || "Untitled Project"}
				</h3>
				<p className="line-clamp-2 text-sm text-muted-foreground">
					{description || "No description provided."}
				</p>
			</div>

			{(target > 0 || raised > 0) && (
				<div className="mt-auto space-y-2 border-t border-border/60 pt-3">
					<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
						<span>Funding Progress</span>
						<span>
							{formatCurrencyETB(raised)}
							{target > 0 ? ` of ${formatCurrencyETB(target)}` : ""}
						</span>
					</div>
					{showProgressBar ? (
						<div className="h-2 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-[#69B34C] transition-[width]"
								style={{ width: `${percent}%` }}
							/>
						</div>
					) : null}
				</div>
			)}
		</article>
	);

	if (!project._id) return card;

	return (
		<Link
			href={`/projects/${project._id}`}
			className="block h-full rounded-xl transition-colors hover:bg-muted/20"
		>
			{card}
		</Link>
	);
}
