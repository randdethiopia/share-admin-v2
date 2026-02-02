"use client";

import { useDeferredValue, useMemo, useState } from "react";

export type WaitlistApplicant = {
	_id: string;
	fullName?: string | null;
	email?: string | null;
	batch?: string | null;
	stage?: string | null;
};

type FilterValue = string;

type WaitListOptions = {
	autoSelectFirst?: boolean;
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

	const deferredQuery = useDeferredValue(searchQuery);
	const deferredBatch = useDeferredValue(batchFilter);
	const deferredStage = useDeferredValue(stageFilter);

	const filteredApplicants = useMemo(() => {
		const q = deferredQuery.trim().toLowerCase();
		const normalizedStageFilter = deferredStage
			? normalizeStageValue(deferredStage)
			: "";
		return (allApplicants ?? []).filter((item) => {
			const name = (item.fullName ?? "").toString().toLowerCase();
			const email = (item.email ?? "").toString().toLowerCase();
			const batch = (item.batch ?? "").toString();
			const stage = (item.stage ?? "").toString();

			const matchesSearch = q ? name.includes(q) || email.includes(q) : true;
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

