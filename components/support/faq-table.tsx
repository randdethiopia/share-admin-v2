"use client";

import { useMemo } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { FaqEmptyState } from "@/components/support/faq-empty-state";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import type { FAQType } from "@/lib/api/faq.types";

type FaqTableProps = {
	faqs: FAQType[];
	loading: boolean;
	search: string;
	refetchFaqs: () => Promise<unknown>;
	onEdit: (faq: FAQType) => void;
	onDelete: (faq: FAQType) => void;
	onAddFirst: () => void;
};

function TableSkeleton() {
	return (
		<>
			{Array.from({ length: 4 }).map((_, index) => (
				<TableRow key={index}>
					<TableCell><Skeleton className="h-5 w-14" /></TableCell>
					<TableCell><Skeleton className="h-10 w-64" /></TableCell>
					<TableCell><Skeleton className="h-6 w-32" /></TableCell>
					<TableCell><Skeleton className="h-8 w-8" /></TableCell>
				</TableRow>
			))}
		</>
	);
}

export function FaqTable({
	faqs,
	loading,
	search,
	refetchFaqs,
	onEdit,
	onDelete,
	onAddFirst,
}: FaqTableProps) {
	const updateMutation = api.FAQ.Update.useMutation({
		onSuccess: async () => {
			await refetchFaqs();
		},
	});

	const filteredFaqs = useMemo(() => {
		const query = search.trim().toLowerCase();
		const sorted = [...faqs].sort((a, b) => a.order - b.order);

		if (!query) return sorted;

		return sorted.filter(
			(faq) =>
				faq.question.toLowerCase().includes(query) ||
				faq.answer.toLowerCase().includes(query)
		);
	}, [faqs, search]);

	if (!loading && faqs.length === 0) {
		return <FaqEmptyState onAddFirst={onAddFirst} />;
	}

	return (
		<div className="rounded-xl border-0 bg-card p-6 shadow-xs">
			<Table>
				<TableHeader>
					<TableRow className="bg-[#F9F9F9] hover:bg-[#F9F9F9]">
						<TableHead className="w-28 text-xs font-bold uppercase tracking-wider">
							<div className="flex flex-col">
								<span>DISPLAY ORDER</span>
								<span className="text-[10px] font-normal lowercase text-muted-foreground">
									(chatbot priority)
								</span>
							</div>
						</TableHead>
						<TableHead className="text-xs font-bold uppercase tracking-wider">
							Question & Answer
						</TableHead>
						<TableHead className="min-w-[180px] w-48 text-xs font-bold uppercase tracking-wider">
							LIVE IN CHATBOT
						</TableHead>
						<TableHead className="w-16 text-right text-xs font-bold uppercase tracking-wider">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						<TableSkeleton />
					) : filteredFaqs.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={4}
								className="h-32 text-center text-sm text-muted-foreground"
							>
								No entries match your search.
							</TableCell>
						</TableRow>
					) : (
						filteredFaqs.map((faq) => {
							const isRowUpdating =
								updateMutation.isPending &&
								updateMutation.variables?.id === faq._id;

							return (
							<TableRow
								key={faq._id}
								className="transition-colors hover:bg-muted/30"
							>
								<TableCell>
									<span className="rounded bg-muted px-2 py-1 font-mono text-xs font-bold">
										#{faq.order}
									</span>
								</TableCell>
								<TableCell>
									<div className="flex max-w-xl flex-col gap-1">
										<span className="font-semibold text-foreground">
											{faq.question}
										</span>
										<span className="line-clamp-1 text-xs text-muted-foreground">
											{faq.answer}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Switch
											checked={faq.isActive}
											disabled={isRowUpdating}
											onCheckedChange={(checked) =>
												updateMutation.mutate({
													id: faq._id,
													isActive: checked,
												})
											}
										/>
										<span className="text-xs font-semibold">
											{isRowUpdating
												? "Updating..."
												: faq.isActive
													? "Live in Chatbot"
													: "Hidden from Chatbot"}
										</span>
									</div>
								</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												aria-label="FAQ actions"
											>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuItem
												onClick={() => onEdit(faq)}
												className="flex cursor-pointer items-center gap-2"
											>
												<Pencil className="h-4 w-4 text-primary" />
												Edit Entry
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onDelete(faq)}
												className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
												Delete Entry
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
