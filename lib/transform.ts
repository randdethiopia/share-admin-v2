import {
	addDays,
	addMonths,
	format,
	isAfter,
	isBefore,
	startOfDay,
	startOfMonth,
	startOfYear,
	subDays,
	subMonths,
	endOfYear,
} from "date-fns";

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

function pickAnalyticsDate(item: WithAnalyticsDate): Date | null {
	const candidates = [
		item.approvedAt,
		item.createdAt,
		item.postedDate,
		item.datePosted,
	];

	for (const value of candidates) {
		if (!value) continue;

		const date = toDate(value);
		if (!Number.isNaN(date.getTime())) return date;
	}

	return null;
}

function buildBuckets(days: number) {
	const now = new Date();
	const buckets = new Map<string, { label: string; value: number }>();

	if (days >= 365) {
		const start = startOfMonth(subMonths(now, 11));

		for (let index = 0; index < 12; index += 1) {
			const date = addMonths(start, index);
			buckets.set(format(date, "yyyy-MM"), {
				label: format(date, "MMM"),
				value: 0,
			});
		}

		return {
			start,
			keyFor: (date: Date) => format(startOfMonth(date), "yyyy-MM"),
			buckets,
		};
	}

	const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
	const start = startOfDay(subDays(now, safeDays - 1));

	for (let index = 0; index < safeDays; index += 1) {
		const date = addDays(start, index);
		buckets.set(format(date, "yyyy-MM-dd"), {
			label: format(date, "MMM dd"),
			value: 0,
		});
	}

	return {
		start,
		keyFor: (date: Date) => format(startOfDay(date), "yyyy-MM-dd"),
		buckets,
	};
}

export function transformAnalyticsData<T extends WithAnalyticsDate>(
	data: readonly T[] = [],
	days: number
): AnalyticsPoint[] {
	const { start, keyFor, buckets } = buildBuckets(days);
	const end = new Date();

	for (const item of data) {
		const d = item ? pickAnalyticsDate(item) : null;
		if (!d) continue;
		if (isBefore(d, start) || isAfter(d, end)) continue;

		const key = keyFor(d);
		const bucket = buckets.get(key);
		if (!bucket) continue;

		buckets.set(key, { ...bucket, value: bucket.value + 1 });
	}

	return Array.from(buckets.values()).map((bucket) => ({
		date: bucket.label,
		value: bucket.value,
	}));
}

export function getAnalyticsYear(item: WithAnalyticsDate): number | null {
	const date = pickAnalyticsDate(item);
	return date ? date.getFullYear() : null;
}

export function transformAnalyticsDataByYear<T extends WithAnalyticsDate>(
	data: readonly T[] = [],
	year: number
): AnalyticsPoint[] {
	const safeYear = Number.isFinite(year) ? year : new Date().getFullYear();
	const start = startOfYear(new Date(safeYear, 0, 1));
	const end = endOfYear(start);
	const buckets = new Map<string, { label: string; value: number }>();

	for (let index = 0; index < 12; index += 1) {
		const date = addMonths(start, index);
		buckets.set(format(date, "yyyy-MM"), {
			label: format(date, "MMM"),
			value: 0,
		});
	}

	for (const item of data) {
		const d = item ? pickAnalyticsDate(item) : null;
		if (!d) continue;
		if (isBefore(d, start) || isAfter(d, end)) continue;

		const key = format(startOfMonth(d), "yyyy-MM");
		const bucket = buckets.get(key);
		if (!bucket) continue;

		buckets.set(key, { ...bucket, value: bucket.value + 1 });
	}

	return Array.from(buckets.values()).map((bucket) => ({
		date: bucket.label,
		value: bucket.value,
	}));
}
