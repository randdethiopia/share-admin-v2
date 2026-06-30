import type { AdminDashboardStats, ProfileStatusKey } from "@/lib/api/admin-dashboard";

export const DASHBOARD_PANEL_CLASS =
	"bg-white/90 backdrop-blur border border-slate-200/80 shadow-sm text-slate-900";

export const STATUS_COLORS: Record<ProfileStatusKey, string> = {
	APPROVED: "#1D9E75",
	PENDING: "#EF9F27",
	REJECTED: "#E24B4A",
	DRAFT: "#888780",
};

export const LINE_COLORS = {
	sme: "#378ADD",
	advisor: "#1D9E75",
	investor: "#7F77DD",
} as const;

export const COMPLETION_THRESHOLD = 70;

const STATUS_LABELS: Record<ProfileStatusKey, string> = {
	APPROVED: "Approved",
	PENDING: "Pending",
	REJECTED: "Rejected",
	DRAFT: "Draft",
};

const ROLE_LABELS = {
	sme: "Business",
	advisor: "Expert",
	investor: "Mentor",
} as const;

function normalizeStatus(status: string): ProfileStatusKey | null {
	const upper = status.trim().toUpperCase();
	if (upper in STATUS_COLORS) return upper as ProfileStatusKey;
	return null;
}

export function mapStatusDonutData(
	statusDistribution: AdminDashboardStats["statusDistribution"]
) {
	const totals: Record<ProfileStatusKey, number> = {
		APPROVED: 0,
		PENDING: 0,
		REJECTED: 0,
		DRAFT: 0,
	};

	for (const role of ["sme", "advisor", "investor"] as const) {
		for (const item of statusDistribution[role]) {
			const key = normalizeStatus(item.status);
			if (key) totals[key] += item.count;
		}
	}

	return (Object.keys(STATUS_COLORS) as ProfileStatusKey[]).map((status) => ({
		name: STATUS_LABELS[status],
		status,
		value: totals[status],
		fill: STATUS_COLORS[status],
	}));
}

export function mapStatusByRoleData(
	statusDistribution: AdminDashboardStats["statusDistribution"]
) {
	return (["sme", "advisor", "investor"] as const).map((role) => {
		const row: Record<string, string | number> = {
			role: ROLE_LABELS[role],
		};

		for (const status of Object.keys(STATUS_COLORS) as ProfileStatusKey[]) {
			row[status] =
				statusDistribution[role].find(
					(item) => normalizeStatus(item.status) === status
				)?.count ?? 0;
		}

		return row;
	});
}

export function mapMonthlyTrendsData(
	monthlyTrends: AdminDashboardStats["monthlyTrends"]
) {
	return monthlyTrends.map((point) => ({
		label: point.label,
		sme: point.sme,
		advisor: point.advisor,
		investor: point.investor,
	}));
}

export function mapIndustrySectorsData(
	industrySectors: AdminDashboardStats["industrySectors"]
) {
	const smeMap = new Map(
		industrySectors.smeIndustries.map((item) => [item._id, item.count])
	);
	const advisorMap = new Map(
		industrySectors.advisorCategories.map((item) => [item._id, item.count])
	);
	const sectors = new Set([...smeMap.keys(), ...advisorMap.keys()]);

	return Array.from(sectors).map((sector) => ({
		sector,
		sme: smeMap.get(sector) ?? 0,
		advisor: advisorMap.get(sector) ?? 0,
	}));
}

export function mapCompletionRatesData(
	completionRates: AdminDashboardStats["completionRates"]
) {
	return [
		{ role: ROLE_LABELS.sme, rate: completionRates.sme.average, key: "sme" as const },
		{
			role: ROLE_LABELS.advisor,
			rate: completionRates.advisor.average,
			key: "advisor" as const,
		},
		{
			role: ROLE_LABELS.investor,
			rate: completionRates.investor.average,
			key: "investor" as const,
		},
	];
}

/** Grouped bucket counts per completion range (0-25, 26-50, …) across profile types. */
export function mapCompletionBucketsData(
	completionRates: AdminDashboardStats["completionRates"]
) {
	const bucketOrder = ["0-25", "26-50", "51-75", "76-100"] as const;

	return bucketOrder.map((bucket) => ({
		bucket,
		sme:
			completionRates.sme.buckets.find((b) => b._id === bucket)?.count ?? 0,
		advisor:
			completionRates.advisor.buckets.find((b) => b._id === bucket)?.count ?? 0,
		investor:
			completionRates.investor.buckets.find((b) => b._id === bucket)?.count ?? 0,
	}));
}

/** Stacked size/experience rows for grouped bar display. */
export function mapSizeDistributionGrouped(
	sizeDistribution: AdminDashboardStats["sizeDistribution"]
) {
	return [
		{
			profile: ROLE_LABELS.advisor,
			profileKey: "advisor" as const,
			...Object.fromEntries(
				sizeDistribution.advisors.map((item) => [item._id, item.count])
			),
		},
		{
			profile: ROLE_LABELS.sme,
			profileKey: "sme" as const,
			...Object.fromEntries(
				sizeDistribution.smes.map((item) => [item._id, item.count])
			),
		},
	];
}

export function mapSizeDistributionData(
	sizeDistribution: AdminDashboardStats["sizeDistribution"]
) {
	return [
		...sizeDistribution.advisors.map((item) => ({
			bucket: item._id,
			count: item.count,
			profile: "Expert" as const,
		})),
		...sizeDistribution.smes.map((item) => ({
			bucket: item._id,
			count: item.count,
			profile: "Business" as const,
		})),
	];
}

export function getChartTheme() {
	return {
		grid: "rgba(0,0,0,0.1)",
		label: "#64748B",
	};
}
