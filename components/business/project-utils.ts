import type { BusinessProfileProject } from "@/lib/api";

export function parseAmount(value?: string | number | null): number {
	if (value == null || value === "") return 0;
	const parsed =
		typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
	return Number.isFinite(parsed) ? parsed : 0;
}

export function stripHtmlSnippet(value?: string | null): string {
	if (!value?.trim()) return "";
	return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function formatCurrencyETB(amount: number): string {
	return new Intl.NumberFormat("en-ET", {
		style: "currency",
		currency: "ETB",
	}).format(amount);
}

export function getFundingProgress(project: BusinessProfileProject) {
	const target = parseAmount(project.fundingGoal);
	const raised = parseAmount(project.raised);
	const percent = target > 0 ? Math.min((raised / target) * 100, 100) : 0;

	return { target, raised, percent };
}

export function getCategoryLabel(project: BusinessProfileProject): string {
	if (!project.categories?.length) return "Uncategorized";
	return project.categories.filter(Boolean).join(", ");
}
