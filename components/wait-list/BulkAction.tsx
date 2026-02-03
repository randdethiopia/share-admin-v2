"use client";

import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import WaitListApi from "@/api/waitlist";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface BulkActionProps {
	selectedIds: string[];
	totalApplicants?: number;
}

// Removed usage of undefined 'analytics' variable.
// If you need analytics data, pass it as a prop or fetch it where needed.

type PendingStage = { value: string; label: string } | null;


const BULK_STAGE_OPTIONS = [
	{ value: "rejected", label: "Rejected/Not interested" },
	{ value: "registered", label: "Registered/Pending Review" },
	{ value: "eligible", label: "Eligible" },
	{ value: "approved", label: "Approved" },
	{ value: "unable_to_reach", label: "Unable to reach" },
];

export function BulkAction({ selectedIds, totalApplicants }: BulkActionProps) {
	const [pendingStage, setPendingStage] = React.useState<PendingStage>(null);

	const { mutate: updateStage, isPending } = WaitListApi.UpdateStage.useMutation();

	const resolvedStageOptions = BULK_STAGE_OPTIONS;

	const canUse = selectedIds.length > 0 && !isPending;

	const labelText = typeof totalApplicants === "number"
		? `Bulk Action for  ${totalApplicants} Applicant${totalApplicants === 1 ? "" : "s"}`
		: `Bulk Action for ${selectedIds.length} Applicant${selectedIds.length === 1 ? "" : "s"}`;
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="lg"
						disabled={!canUse}
						className="bg-white border-none rounded-xl h-10 font-bold text-xs shadow-sm"
					>
						{isPending ? (
							<Loader2 className="animate-spin mr-2 h-4 w-4" />
						) : null}
						{labelText}
						<ChevronDown className="ml-2 h-4 w-4 opacity-70" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="end"
					className="w-56 rounded-2xl p-2 border-none shadow-xl"
				>
					<div className="px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
						{/* No heading, just the options */}
					</div>
					{resolvedStageOptions.map((opt) => (
						<DropdownMenuItem
							key={opt.value}
							onClick={() => setPendingStage(opt)}
							className={cn(
								"rounded-xl cursor-pointer font-semibold text-slate-700 focus:bg-blue-50 focus:text-blue-700 py-2.5",
								isPending && "pointer-events-none opacity-60"
							)}
						>
							{opt.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={Boolean(pendingStage)} onOpenChange={(open) => !open && setPendingStage(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to update {selectedIds.length} applicant{selectedIds.length !== 1 ? "s" : ""} to “{pendingStage?.label}”?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending || !pendingStage}
							onClick={() => {
								if (!pendingStage) return;
								updateStage({ ids: selectedIds, stage: pendingStage.value });
								setPendingStage(null);
							}}
						>
							{isPending ? "Updating…" : "Update Now"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

