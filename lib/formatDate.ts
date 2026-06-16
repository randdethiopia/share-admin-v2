import { format, isValid, parseISO } from "date-fns";

export function formatDisplayDate(
	value?: string | Date | null
): string | undefined {
	if (!value) return undefined;
	if (value instanceof Date) {
		return isValid(value) ? format(value, "yyyy-MM-dd") : undefined;
	}

	const trimmed = value.trim();
	if (!trimmed) return undefined;

	const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
	const parsed = dateOnlyMatch
		? new Date(
				Number(dateOnlyMatch[1]),
				Number(dateOnlyMatch[2]) - 1,
				Number(dateOnlyMatch[3])
			)
		: parseISO(trimmed);

	if (!isValid(parsed)) return trimmed;
	return format(parsed, "yyyy-MM-dd");
}
