import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type FaqEmptyStateProps = {
	onAddFirst: () => void;
};

export function FaqEmptyState({ onAddFirst }: FaqEmptyStateProps) {
	return (
		<div className="space-y-4 rounded-xl border-0 bg-card p-12 text-center shadow-xs">
			<h3 className="text-lg font-semibold text-foreground">
				No Question Bank Entries Found
			</h3>
			<p className="mx-auto max-w-md text-sm text-muted-foreground">
				Create your first Question Bank entry to help the Share Assistant answer
				users automatically.
			</p>
			<Button
				type="button"
				onClick={onAddFirst}
				className="rounded-md bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-[#529339]"
			>
				<Plus className="mr-2 h-4 w-4" />
				Add First Question
			</Button>
		</div>
	);
}
