"use client";

import { useDeferredValue, useMemo, useState } from "react";

import type { ApplicantListItem } from "@/lib/api/waitlist";

type FilterValue = string;

type WaitListOptions = {
	autoSelectFirst?: boolean;
};

/**
 * Minimal shape the hook needs. Accepting the full {@link ApplicantListItem}
 * works because it derives `fullName` from first/middle/last on the fly.
 */
export type WaitlistApplicant = Pick<
	ApplicantListItem,
	"_id" | "firstName" | "middleName" | "lastName" | "email"
> & {
	batch?: string | null;
	stage?: string | null;
	phoneNumber?: string | null;
};

const normalizeStageValue = (value: string) => {
	const normalized = value.replace(/[^a-z0-9]/gi, " ").trim().toLowerCase();
	if (!normalized) return "";
	const aliasMap: Record<string, string> = {
		"1": "rejected",
		"2": "registered",
		"3": "eligible",
		"4": "approved",
		"5": "unable_to_reach",
		"rejected": "rejected",
		"not interested": "rejected",
		"not_interested": "rejected",
		"registered": "registered",
		"pending review": "registered",
		"pending_review": "registered",
		"eligible": "eligible",
		"approved": "approved",
		"unable to reach": "unable_to_reach",
		"unable_to_reach": "unable_to_reach",
		"unreachable": "unable_to_reach",
	};
	return aliasMap[normalized] ?? normalized.replace(/\s+/g, "_");
};

export function useWaitList<TApplicant extends WaitlistApplicant>(
	allApplicants: TApplicant[] = [],
	options: WaitListOptions = {}
) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [batchFilter, setBatchFilter] = useState<FilterValue>("");
	const [stageFilter, setStageFilter] = useState<FilterValue>("");
	const autoSelectFirst = options.autoSelectFirst ?? true;

	const deferredQuery = useDeferredValue(searchQuery);
	const deferredBatch = useDeferredValue(batchFilter);
	const deferredStage = useDeferredValue(stageFilter);

	const filteredApplicants = useMemo(() => {
		const q = deferredQuery.trim().toLowerCase();
		// Strip non-digits so "+251 91-234-5678" matches "0912345678" etc.
		const phoneQuery = q.replace(/\D/g, "");
		const normalizedStageFilter = deferredStage
			? normalizeStageValue(deferredStage)
			: "";
		return (allApplicants ?? []).filter((item) => {
			const name = `${item.firstName ?? ""} ${item.middleName ?? ""} ${item.lastName ?? ""}`
				.toLowerCase();
			const email = (item.email ?? "").toString().toLowerCase();
			const phone = (item.phoneNumber ?? "").toString().toLowerCase();
			const phoneDigits = phone.replace(/\D/g, "");
			const batch = (item.batch ?? "").toString();
			const stage = (item.stage ?? "").toString();

			const matchesSearch = q
				? name.includes(q) ||
				  email.includes(q) ||
				  phone.includes(q) ||
				  (phoneQuery !== "" && phoneDigits.includes(phoneQuery))
				: true;
			const matchesBatch = !deferredBatch || batch === deferredBatch;
			const normalizedStage = normalizeStageValue(stage);
			const matchesStage = !normalizedStageFilter
				? true
				: normalizedStage === normalizedStageFilter;

			return matchesSearch && matchesBatch && matchesStage;
		});
	}, [allApplicants, deferredQuery, deferredBatch, deferredStage]);

	const selectedApplicant = useMemo(() => {
		if (filteredApplicants.length === 0) return undefined;
		const found = filteredApplicants.find((a) => a._id === selectedId);
		if (found) return found;
		if (!autoSelectFirst) return undefined;
		return filteredApplicants[0];
	}, [filteredApplicants, selectedId, autoSelectFirst]);

	return {
		filteredApplicants,
		selectedApplicant,
		searchQuery,
		setSearchQuery,
		batchFilter,
		setBatchFilter,
		stageFilter,
		setStageFilter,
		setSelectedId,
		selectedId: selectedApplicant?._id ?? null,
	};
}
