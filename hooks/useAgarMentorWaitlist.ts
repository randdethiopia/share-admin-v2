"use client";

import { useMemo, useState } from "react";
import AgarMentorWaitlistApi from "@/lib/api/agar-mentor-waitlist";
import type { AgarMentorWaitlistSortMode } from "@/types/agar-mentor-waitlist";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";

export function useAgarMentorWaitlist() {
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<AgarMentorWaitlistSortMode>("newest");
	const [page, setPage] = useState(1);
	const pageSize = DEFAULT_PAGE_SIZE;

	const { data: applications = [], isLoading, isError, error } =
		AgarMentorWaitlistApi.getWaitlist.useQuery();

	const filteredData = useMemo(() => {
		const query = search.trim().toLowerCase();

		const filtered = query
			? applications.filter((item) => {
					const haystack = [
						item.fullName,
						item.preferredNameTitle,
						item.email,
						item.mobileWhatsApp,
						item.currentJobTitle,
						item.currentOrganization,
						item.mentorType,
						item.currentCityAndCountry,
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
		[filteredData.length, page, pageSize],
	);

	const pageData = useMemo(() => {
		return filteredData.slice(pagination.startIndex, pagination.endIndexExclusive);
	}, [filteredData, pagination.startIndex, pagination.endIndexExclusive]);

	const errorMessage =
		(error as { response?: { data?: { message?: string } } })?.response?.data
			?.message || "Failed to load AGAR mentor waitlist applications";

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleSortChange = (value: AgarMentorWaitlistSortMode) => {
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
		isLoading,
		isError,
		errorMessage,
		setPage,
		handleSearchChange,
		handleSortChange,
	};
}
