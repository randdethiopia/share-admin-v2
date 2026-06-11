import { format, isAfter, subDays } from "date-fns";

export type AnalyticsPoint = {
	date: string;
	value: number;
};

type WithAnalyticsDate = {
	approvedAt?: string | Date | null;
	createdAt?: string | Date | null;
	postedDate?: string | Date | null;
	datePosted?: string | Date | null;
};

function toDate(value: string | Date): Date {
	return value instanceof Date ? value : new Date(value);
}

function pickAnalyticsDate(item: WithAnalyticsDate): string | Date | null | undefined {
	return (
		item.approvedAt ??
		item.createdAt ??
		item.postedDate ??
		item.datePosted ??
		null
	);
}

export function transformAnalyticsData<T extends WithAnalyticsDate>(
	data: readonly T[] = [],
	days: number
): AnalyticsPoint[] {
	const safeDays = Number.isFinite(days) && days > 0 ? days : 0;
	const cutoffDate = subDays(new Date(), safeDays);

	const grouped = new Map<string, { label: string; value: number }>();

	for (const item of data) {
		const raw = item ? pickAnalyticsDate(item) : null;
		if (!raw) continue;

		const d = toDate(raw);
		if (Number.isNaN(d.getTime())) continue;
		if (!isAfter(d, cutoffDate)) continue;

		const key = format(d, "yyyy-MM-dd");
		const label = format(d, "MMM dd");
		const prev = grouped.get(key);
		grouped.set(key, { label, value: (prev?.value ?? 0) + 1 });
	}

	return Array.from(grouped.entries())
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
		.map(([, v]) => ({ date: v.label, value: v.value }));
}

