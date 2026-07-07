export type WaitlistGenderStat = {
	label: string;
	count: number;
	percentage: number;
};

export function getGenderBreakdown<T>(
	applications: T[],
	getGender: (item: T) => string | undefined,
): WaitlistGenderStat[] {
	const total = applications.length;
	const counts = applications.reduce<Record<string, number>>((acc, item) => {
		const label = getGender(item)?.trim() || "Unknown";
		acc[label] = (acc[label] ?? 0) + 1;
		return acc;
	}, {});

	const order = (label: string) => {
		if (label === "Female") return 0;
		if (label === "Male") return 1;
		return 2;
	};

	return Object.entries(counts)
		.sort(([a], [b]) => {
			const orderDiff = order(a) - order(b);
			return orderDiff !== 0 ? orderDiff : a.localeCompare(b);
		})
		.map(([label, count]) => ({
			label,
			count,
			percentage: total > 0 ? Math.round((count / total) * 100) : 0,
		}));
}
