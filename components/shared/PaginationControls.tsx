"use client";

import { useMemo } from "react";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import {
	buildPageItems,
	DEFAULT_PAGE_SIZE,
	getPaginationMeta,
} from "@/lib/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
	page: number;
	onPageChange: (page: number) => void;
	totalItems: number;
	pageSize?: number;
	className?: string;
	paginationClassName?: string;
	showRange?: boolean;
	disabled?: boolean;
};

export default function PaginationControls({
	page,
	onPageChange,
	totalItems,
	pageSize = DEFAULT_PAGE_SIZE,
	className,
	paginationClassName,
	showRange = true,
	disabled = false,
}: Props) {
	const meta = useMemo(
		() => getPaginationMeta(totalItems, page, pageSize),
		[totalItems, page, pageSize]
	);

	const pageItems = useMemo(
		() => buildPageItems(meta.safePage, meta.totalPages),
		[meta.safePage, meta.totalPages]
	);

	if (meta.totalItems <= 0 || meta.totalPages <= 1) return null;

	const canPrev = !disabled && meta.safePage > 1;
	const canNext = !disabled && meta.safePage < meta.totalPages;

	return (
		<div
			className={cn(
				"mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
				className
			)}
		>
			{showRange && (
				<p className="text-xs text-gray-500">
					Showing <span className="font-semibold">{meta.showingFrom}</span>-<span className="font-semibold">{meta.showingTo}</span> of{" "}
					<span className="font-semibold">{meta.totalItems}</span>
				</p>
			)}

			<Pagination className={cn("justify-start sm:justify-center", paginationClassName)}>
				<PaginationContent>
					<PaginationItem>
						<PaginationLink
							href="#"
							size="default"
							aria-label="Go to previous page"
							onClick={(e) => {
								e.preventDefault();
								if (!canPrev) return;
								onPageChange(meta.safePage - 1);
							}}
							className={cn(
								"gap-2 px-3",
								!canPrev && "pointer-events-none opacity-50"
							)}
						>
							<ChevronLeft className="h-4 w-4" />
							<span>Prev</span>
						</PaginationLink>
					</PaginationItem>

					{pageItems.map((item, idx) =>
						item === "ellipsis" ? (
							<PaginationItem key={`ellipsis-${idx}`}>
								<PaginationEllipsis />
							</PaginationItem>
						) : (
							<PaginationItem key={item}>
								<PaginationLink
									href="#"
									isActive={meta.safePage === item}
									onClick={(e) => {
										e.preventDefault();
										if (disabled) return;
										onPageChange(item);
									}}
								>
									{item}
								</PaginationLink>
							</PaginationItem>
						)
					)}

					<PaginationItem>
						<PaginationLink
							href="#"
							size="default"
							aria-label="Go to next page"
							onClick={(e) => {
								e.preventDefault();
								if (!canNext) return;
								onPageChange(meta.safePage + 1);
							}}
							className={cn(
								"gap-2 px-3",
								!canNext && "pointer-events-none opacity-50"
							)}
						>
							<span>Next</span>
							<ChevronRight className="h-4 w-4" />
						</PaginationLink>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
