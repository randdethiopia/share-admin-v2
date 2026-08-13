import type { BusinessProfileProject } from "@/lib/api";
import { BusinessProjectCard } from "@/components/business/business-project-card";
import { CardGridSkeleton } from "@/components/shared/page-skeletons";
import { Button } from "@/components/ui/button";

type BusinessProjectsTabProps = {
	projects?: BusinessProfileProject[];
	isLoading?: boolean;
	isError?: boolean;
	onRetry?: () => void;
};

export function BusinessProjectsTab({
	projects = [],
	isLoading = false,
	isError = false,
	onRetry,
}: BusinessProjectsTabProps) {
	if (isLoading) {
		return (
			<CardGridSkeleton
				count={6}
				className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
			/>
		);
	}

	if (isError) {
		return (
			<div className="rounded-xl border-0 bg-card p-8 text-center shadow-xs">
				<p className="text-sm font-semibold text-foreground">
					Failed to load project details
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					Please refresh and try again.
				</p>
				{onRetry ? (
					<Button variant="outline" className="mt-4" onClick={onRetry}>
						Retry
					</Button>
				) : null}
			</div>
		);
	}

	if (projects.length === 0) {
		return (
			<div className="rounded-xl border-0 bg-card p-8 text-center shadow-xs">
				<p className="text-sm font-semibold text-foreground">
					No projects submitted by this business yet.
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
			{projects.map((project) => (
				<BusinessProjectCard key={project._id} project={project} />
			))}
		</div>
	);
}
