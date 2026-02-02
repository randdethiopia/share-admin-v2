"use client";

import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionModalProps {
	children: React.ReactNode;
	className?: string;
}

export const BulkActionModal = ({ children, className }: BulkActionModalProps) => {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					className="h-9 w-9 rounded-xl border-blue-100 bg-white text-blue-600 shadow-sm transition-all hover:bg-blue-50"
				>
					<Filter className="h-4 w-4" />
					<span className="sr-only">Open Filters</span>
				</Button>
			</DialogTrigger>

			<DialogContent
				className={cn(
					"max-h-[85vh] max-w-4xl overflow-y-auto rounded-[2rem] border-none p-10 shadow-2xl",
					className,
				)}
			>
				<DialogHeader className="mb-6">
					<div className="flex items-center gap-3">
						<div className="rounded-lg bg-blue-50 p-2 text-blue-600">
							<Filter size={18} />
						</div>
						<div>
							<DialogTitle className="text-2xl font-bold text-gray-900">
								Advanced Filtering
							</DialogTitle>
							<DialogDescription className="font-medium text-gray-500">
								Refine the applicant list to perform bulk operations.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="mt-2">{children}</div>
			</DialogContent>
		</Dialog>
	);
};
