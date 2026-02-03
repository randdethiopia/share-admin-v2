"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CardGridSkeleton(props: {
	count?: number;
	className?: string;
	itemClassName?: string;
}) {
	const { count = 10, className, itemClassName } = props;

	return (
		<div
			className={cn(
				"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12",
				className
			)}
		>
			{Array.from({ length: count }).map((_, idx) => (
				<div key={idx} className={cn("space-y-3", itemClassName)}>
					<Skeleton className="aspect-4/3 w-full rounded-2xl" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-full" />
					<div className="flex gap-2">
						<Skeleton className="h-6 w-16 rounded-full" />
						<Skeleton className="h-6 w-20 rounded-full" />
					</div>
				</div>
			))}
		</div>
	);
}

export function DetailPageSkeleton(props: { className?: string }) {
	return (
		<div className={cn("min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8", props.className)}>
			<div className="mx-auto w-full max-w-5xl space-y-6">
				<div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
					<div className="p-6 sm:p-8 space-y-4">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-3/4" />
					</div>
				</div>

				<div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
					<Skeleton className="w-full aspect-video rounded-none" />
					<div className="p-6 sm:p-8 space-y-3">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-11/12" />
						<Skeleton className="h-4 w-10/12" />
						<Skeleton className="h-4 w-9/12" />
						<div className="pt-6 mt-6 border-t border-slate-100 flex flex-wrap gap-2">
							<Skeleton className="h-9 w-44 rounded-full" />
							<Skeleton className="h-9 w-40 rounded-full" />
							<Skeleton className="h-9 w-52 rounded-full" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function DashboardSkeleton() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<Skeleton className="h-9 w-48" />
				<Skeleton className="h-4 w-56" />
			</div>

			<div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-1 shadow-sm">
				<Skeleton className="h-9 w-full rounded-xl" />
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{Array.from({ length: 3 }).map((_, index) => (
					<div key={`dash-stat-skeleton-${index}`} className="rounded-2xl border bg-white p-5 shadow-sm">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="mt-3 h-9 w-20" />
						<Skeleton className="mt-4 h-4 w-16" />
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div className="space-y-4">
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-72 w-full rounded-2xl" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-72 w-full rounded-2xl" />
				</div>
				<div className="space-y-4 lg:col-span-2">
					<Skeleton className="h-6 w-28" />
					<Skeleton className="h-80 w-full rounded-2xl" />
				</div>
			</div>
		</div>
	);
}

export function CenteredBlockSkeleton(props: { className?: string }) {
	return (
		<div className={cn("flex items-center justify-center min-h-[60vh]", props.className)}>
			<div className="w-full max-w-md space-y-3">
				<Skeleton className="h-8 w-2/3" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-11/12" />
				<Skeleton className="h-4 w-10/12" />
			</div>
		</div>
	);
}
