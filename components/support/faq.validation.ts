import { z } from "zod";

export const faqFormSchema = z.object({
	question: z.string().min(5, "Question must be at least 5 characters"),
	answer: z.string().min(5, "Answer must be at least 5 characters"),
	order: z.number().min(1, "Order must be at least 1"),
	isActive: z.boolean(),
	category: z.string().optional(),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;
