"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/admin/PageHeader";
import api from "@/lib/api";

import { LoginLogFilterBar } from "./components/login-log-filter-bar";
import { LoginLogMetrics } from "./components/login-log-metrics";
import { LoginLogPagination } from "./components/login-log-pagination";
import { LoginLogTable } from "./components/login-log-table";
import {
	buildLoginLogQueryParams,
	DEFAULT_FILTERS,
	DEFAULT_PAGE_SIZE,
	hasActiveFilters,
	SEARCH_DEBOUNCE_MS,
	type LoginLogFilters,
} from "./components/login-logs.constants";

export default function LoginLogsPage() {
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
	const [filters, setFilters] = useState<LoginLogFilters>(DEFAULT_FILTERS);
	const [identifier, setIdentifier] = useState("");

	// Debounce the search box so the API isn't hit on every keystroke.
	useEffect(() => {
		const timeout = setTimeout(() => {
			setIdentifier(filters.search.trim());
			setPage(1);
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [filters.search]);

	const queryParams = useMemo(
		() => buildLoginLogQueryParams({ filters, identifier, page, limit: pageSize }),
		[filters, identifier, page, pageSize]
	);

	const { data, isLoading, isError, error, isFetching } =
		api.LoginLog.GetList.useQuery(queryParams);

	// Every filter change sends the user back to the first page.
	const updateFilters = (patch: Partial<LoginLogFilters>) => {
		setFilters((prev) => ({ ...prev, ...patch }));
		setPage(1);
	};

	const resetFilters = () => {
		setFilters(DEFAULT_FILTERS);
		setIdentifier("");
		setPage(1);
	};

	return (
		<div className="w-full space-y-5 bg-background p-6">
			<PageHeader
				category="SYSTEM"
				title="Login Logs"
				description="Every sign-in attempt by admins and trainees, newest first."
			/>

			<LoginLogMetrics
				summary={data?.summary}
				onResultSelect={(result) => updateFilters({ result })}
			/>

			{isError ? (
				<div className="rounded-xl border-0 bg-destructive/5 px-4 py-3 text-sm text-destructive shadow-xs">
					{error?.response?.data?.message || "Failed to load login logs."}
				</div>
			) : null}

			<div className="rounded-xl border-0 bg-card p-6 shadow-xs">
				<LoginLogFilterBar filters={filters} onChange={updateFilters} onReset={resetFilters} />

				<LoginLogTable
					logs={data?.data ?? []}
					loading={isLoading}
					refreshing={isFetching && !isLoading}
					hasFilters={hasActiveFilters(filters)}
				/>

				<LoginLogPagination
					page={page}
					pageSize={pageSize}
					totalItems={data?.pagination.total ?? 0}
					disabled={isFetching}
					onPageChange={setPage}
					onPageSizeChange={(size) => {
						setPageSize(size);
						setPage(1);
					}}
				/>
			</div>
		</div>
	);
}
