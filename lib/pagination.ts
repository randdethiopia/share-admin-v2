export type PageItem = number | "ellipsis";

export const DEFAULT_PAGE_SIZE = 10;

export function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const items: PageItem[] = [];
	const push = (value: PageItem) => items.push(value);

	push(1);

	const left = Math.max(2, currentPage - 1);
	const right = Math.min(totalPages - 1, currentPage + 1);

	if (left > 2) push("ellipsis");
	for (let p = left; p <= right; p += 1) push(p);
	if (right < totalPages - 1) push("ellipsis");

	push(totalPages);
	return items;
}

export function getPaginationMeta(totalItems: number, page: number, pageSize: number) {
	const safeTotalItems = Math.max(0, totalItems);
	const safePageSize = Math.max(1, pageSize);

	const totalPages = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
	const safePage = Math.min(Math.max(1, page), totalPages);

	const startIndex = (safePage - 1) * safePageSize;
	const endIndexExclusive = Math.min(startIndex + safePageSize, safeTotalItems);

	const showingFrom = safeTotalItems === 0 ? 0 : startIndex + 1;
	const showingTo = endIndexExclusive;

	return {
		totalItems: safeTotalItems,
		pageSize: safePageSize,
		totalPages,
		safePage,
		startIndex,
		endIndexExclusive,
		showingFrom,
		showingTo,
	};
}
