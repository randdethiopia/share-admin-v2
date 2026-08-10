"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { FAQType } from "@/lib/api/faq.types";

type FaqDeleteDialogProps = {
	faq: FAQType | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isPending?: boolean;
};

export function FaqDeleteDialog({
	faq,
	open,
	onOpenChange,
	onConfirm,
	isPending = false,
}: FaqDeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md rounded-2xl border-0 bg-card p-6 shadow-lg">
				<DialogHeader>
					<DialogTitle>Delete Question Bank Entry</DialogTitle>
					<DialogDescription className="space-y-2 pt-2">
						<span className="block">
							Are you sure you want to delete this Question Bank entry?
						</span>
						{faq ? (
							<span className="block font-medium text-foreground">
								Question: {faq.question}
							</span>
						) : null}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={onConfirm}
						disabled={isPending}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						Delete Question
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
