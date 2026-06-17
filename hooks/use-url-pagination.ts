"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export const PAGE_URL_PARAM = "page";
export const PAGE_SIZE_URL_PARAM = "pageSize";

const ALLOWED_PAGE_SIZES = [10, 20, 50] as const;

export function parsePageParam(value: string | null): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 1) return 1;
	return Math.floor(parsed);
}

export function parsePageSizeParam(value: string | null): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return DEFAULT_PAGE_SIZE;
	const floored = Math.floor(parsed);
	return ALLOWED_PAGE_SIZES.includes(floored as (typeof ALLOWED_PAGE_SIZES)[number])
		? floored
		: DEFAULT_PAGE_SIZE;
}

export function buildPaginationQuery(page: number, pageSize: number): string {
	const params = new URLSearchParams();

	if (page > 1) {
		params.set(PAGE_URL_PARAM, String(Math.floor(page)));
	}

	if (pageSize !== DEFAULT_PAGE_SIZE) {
		params.set(PAGE_SIZE_URL_PARAM, String(pageSize));
	}

	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export function buildListHref(
	listPath: string,
	page: number,
	pageSize: number
): string {
	return `${listPath}${buildPaginationQuery(page, pageSize)}`;
}

export function buildDetailHref(
	listPath: string,
	id: string,
	page: number,
	pageSize: number
): string {
	return `${listPath}/${id}${buildPaginationQuery(page, pageSize)}`;
}

function applyPaginationParams(
	params: URLSearchParams,
	page: number,
	pageSize: number
) {
	if (page <= 1) {
		params.delete(PAGE_URL_PARAM);
	} else {
		params.set(PAGE_URL_PARAM, String(Math.floor(page)));
	}

	if (pageSize === DEFAULT_PAGE_SIZE) {
		params.delete(PAGE_SIZE_URL_PARAM);
	} else {
		params.set(PAGE_SIZE_URL_PARAM, String(pageSize));
	}
}

function buildPaginationUrl(
	pathname: string,
	searchParams: URLSearchParams,
	page: number,
	pageSize: number
) {
	const params = new URLSearchParams(searchParams.toString());
	applyPaginationParams(params, page, pageSize);

	const qs = params.toString();
	return qs ? `${pathname}?${qs}` : pathname;
}

export function useUrlPagination() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const page = useMemo(
		() => parsePageParam(searchParams.get(PAGE_URL_PARAM)),
		[searchParams]
	);

	const pageSize = useMemo(
		() => parsePageSizeParam(searchParams.get(PAGE_SIZE_URL_PARAM)),
		[searchParams]
	);

	const paginationQuery = useMemo(
		() => buildPaginationQuery(page, pageSize),
		[page, pageSize]
	);

	const updatePagination = useCallback(
		(nextPage: number, nextPageSize: number, method: "push" | "replace") => {
			const safePage = Math.max(1, Math.floor(nextPage));
			const safePageSize = parsePageSizeParam(String(nextPageSize));
			const nextUrl = buildPaginationUrl(
				pathname,
				searchParams,
				safePage,
				safePageSize
			);
			const currentUrl = buildPaginationUrl(
				pathname,
				searchParams,
				page,
				pageSize
			);

			console.log("[useUrlPagination] Attempting update:", {
				fromPage: page,
				toPage: safePage,
				currentUrl,
				nextUrl,
				isSame: nextUrl === currentUrl
			});

			if (nextUrl === currentUrl) return;

			if (method === "push") {
				console.log("[useUrlPagination] Executing router.push to:", nextUrl);
				router.push(nextUrl, { scroll: false });
			} else {
				console.log("[useUrlPagination] Executing router.replace to:", nextUrl);
				router.replace(nextUrl, { scroll: false });
			}
		},
		[pathname, page, pageSize, router, searchParams]
	);

	const setPage = useCallback(
		(nextPage: number) => {
			console.log("[useUrlPagination] setPage called with:", nextPage);
			updatePagination(nextPage, pageSize, "push");
		},
		[pageSize, updatePagination]
	);

	const setPageSize = useCallback(
		(nextPageSize: number) => {
			updatePagination(1, nextPageSize, "push");
		},
		[updatePagination]
	);

	const resetPagination = useCallback(() => {
		updatePagination(1, pageSize, "replace");
	}, [pageSize, updatePagination]);

	return {
		page,
		pageSize,
		paginationQuery,
		setPage,
		setPageSize,
		resetPagination,
	};
}

/** Build list href using pagination params preserved on the detail URL. */
export function useListReturnHref(listPath: string): string {
	const searchParams = useSearchParams();

	const page = useMemo(
		() => parsePageParam(searchParams.get(PAGE_URL_PARAM)),
		[searchParams]
	);

	const pageSize = useMemo(
		() => parsePageSizeParam(searchParams.get(PAGE_SIZE_URL_PARAM)),
		[searchParams]
	);

	return useMemo(
		() => buildListHref(listPath, page, pageSize),
		[listPath, page, pageSize]
	);
}

/** Clamp page in the URL after data loads; skip while loading or empty. */
export function useCorrectPaginationPage(options: {
	isLoading: boolean;
	totalItems: number;
	page: number;
	safePage: number;
	setPage: (page: number) => void;
}) {
	const { isLoading, totalItems, page, safePage, setPage } = options;

	useEffect(() => {
		console.log("[useCorrectPaginationPage] Check:", { isLoading, totalItems, page, safePage });
		if (isLoading || totalItems <= 0) return;
		if (page !== safePage) {
			console.warn("[useCorrectPaginationPage] Misalignment detected! Reverting page to:", safePage);
			setPage(safePage);
		}
	}, [isLoading, totalItems, page, safePage, setPage]);
}