import { Skeleton } from "@/components/ui/skeleton";

function MetricCardSkeleton() {
	return (
		<div className="rounded-md bg-secondary p-4">
			<Skeleton className="mb-3 h-3 w-24" />
			<Skeleton className="h-7 w-20" />
			<Skeleton className="mt-2 h-3 w-16" />
		</div>
	);
}

function ChartPanelSkeleton({ taller = false }: { taller?: boolean }) {
	return (
		<div className="rounded-lg border border-border/60 bg-card p-5">
			<div className="mb-4 flex items-center justify-between">
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-6 w-6 rounded-md" />
			</div>
			<div className="mb-3 flex gap-3">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-3 w-28" />
			</div>
			<Skeleton className={taller ? "h-[280px] w-full rounded-md" : "h-[200px] w-full rounded-md"} />
		</div>
	);
}

function SnapshotCardSkeleton() {
	return (
		<div className="rounded-md border border-border/50 bg-card px-3.5 py-3">
			<Skeleton className="mb-2 h-3 w-28" />
			<Skeleton className="h-5 w-24" />
			<Skeleton className="mt-2 h-3 w-36" />
			<div className="mt-3 space-y-2">
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-5/6" />
				<Skeleton className="h-3 w-4/5" />
			</div>
		</div>
	);
}

export function TraineeStatSkeleton() {
	return (
		<div
			className="flex min-h-[60vh] w-full flex-col justify-center py-4"
			aria-busy="true"
			aria-label="Loading trainee statistics"
		>
			<div className="flex flex-col gap-6">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCardSkeleton />
					<MetricCardSkeleton />
					<MetricCardSkeleton />
					<MetricCardSkeleton />
				</div>

				<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<ChartPanelSkeleton />
					<ChartPanelSkeleton taller />
				</div>

				<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
					<ChartPanelSkeleton />
					<ChartPanelSkeleton />
				</div>

				<ChartPanelSkeleton />

				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					<SnapshotCardSkeleton />
					<SnapshotCardSkeleton />
					<SnapshotCardSkeleton />
				</div>
			</div>
		</div>
	);
}
