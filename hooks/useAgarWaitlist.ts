"use client";

import { useMemo, useState } from "react";
import AgarWaitlistApi from "@/lib/api/agar-waitlist";
import type { AgarWaitlistSortMode } from "@/types/agar-waitlist";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";
import { getGenderBreakdown } from "@/lib/waitlist-stats";

export function useAgarWaitlist() {
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<AgarWaitlistSortMode>("newest");
	const [page, setPage] = useState(1);
	const pageSize = DEFAULT_PAGE_SIZE;

	const { data: applications = [], isLoading, isError, error } =
		AgarWaitlistApi.getWaitlist.useQuery();

	const filteredData = useMemo(() => {
		const query = search.trim().toLowerCase();

		const filtered = query
			? applications.filter((item) => {
					const haystack = [
						item.fullName,
						item.businessName,
						item.email,
						item.mobile,
						item.city,
						item.sector,
						item.titleRole,
					]
						.filter(Boolean)
						.join(" ")
						.toLowerCase();
					return haystack.includes(query);
				})
			: applications;

		return [...filtered].sort((a, b) => {
			const aTime = new Date(a.createdAt ?? 0).getTime();
			const bTime = new Date(b.createdAt ?? 0).getTime();
			return sort === "newest" ? bTime - aTime : aTime - bTime;
		});
	}, [applications, search, sort]);

	const pagination = useMemo(
		() => getPaginationMeta(filteredData.length, page, pageSize),
		[filteredData.length, page, pageSize]
	);

	const pageData = useMemo(() => {
		return filteredData.slice(pagination.startIndex, pagination.endIndexExclusive);
	}, [filteredData, pagination.startIndex, pagination.endIndexExclusive]);

	const stats = useMemo(
		() => ({
			total: applications.length,
			genderBreakdown: getGenderBreakdown(
				applications,
				(item) => item.founderGender,
			),
		}),
		[applications],
	);

	const errorMessage =
		(error as { response?: { data?: { message?: string } } })?.response?.data
			?.message || "Failed to load AGAR waitlist applications";

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleSortChange = (value: AgarWaitlistSortMode) => {
		setSort(value);
		setPage(1);
	};

	return {
		search,
		sort,
		page,
		pageSize,
		pageData,
		filteredData,
		stats,
		isLoading,
		isError,
		errorMessage,
		setPage,
		handleSearchChange,
		handleSortChange,
	};
}
