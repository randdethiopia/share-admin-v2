"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import {
	faqFormSchema,
	type FaqFormValues,
} from "@/components/support/faq.validation";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import type { FAQType } from "@/lib/api/faq.types";

type FaqDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	faq?: FAQType | null;
	refetchFaqs: () => Promise<unknown>;
};

const defaultValues: FaqFormValues = {
	question: "",
	answer: "",
	order: 1,
	isActive: true,
	category: undefined,
};

export function FaqDialog({ open, onOpenChange, faq, refetchFaqs }: FaqDialogProps) {
	const isEdit = Boolean(faq?._id);

	const form = useForm<FaqFormValues>({
		resolver: zodResolver(faqFormSchema),
		defaultValues,
	});

	const { mutate: createFaq, isPending: isCreating } =
		api.FAQ.Create.useMutation({
			onSuccess: async () => {
				await refetchFaqs();
				onOpenChange(false);
			},
		});

	const { mutate: updateFaq, isPending: isUpdating } =
		api.FAQ.Update.useMutation({
			onSuccess: async () => {
				await refetchFaqs();
				onOpenChange(false);
			},
		});

	const isPending = isCreating || isUpdating;

	useEffect(() => {
		if (!open) return;

		if (faq) {
			form.reset({
				question: faq.question,
				answer: faq.answer,
				order: faq.order,
				isActive: faq.isActive,
				category: faq.category,
			});
			return;
		}

		form.reset(defaultValues);
	}, [open, faq, form]);

	const onSubmit = (values: FaqFormValues) => {
		if (isEdit && faq) {
			updateFaq({ id: faq._id, ...values });
			return;
		}

		createFaq(values);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl space-y-6 rounded-2xl border-0 bg-card p-6 shadow-lg">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Question Bank Entry" : "Add Question Bank Entry"}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="question"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Question</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Enter the question..."
											className="border-0 bg-[#F4F4F5]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="answer"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Answer</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Enter the answer..."
											className="min-h-[120px] border-0 bg-[#F4F4F5]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="order"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Order</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={1}
											value={field.value}
											onChange={(e) =>
												field.onChange(Number(e.target.value) || 1)
											}
											className="border-0 bg-[#F4F4F5]"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isActive"
							render={({ field }) => (
								<FormItem className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
									<FormLabel className="mt-0">Active</FormLabel>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-3 pt-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending}>
								{isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								{isEdit ? "Save Changes" : "Add Question"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
