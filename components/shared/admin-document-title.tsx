"use client";

import { useEffect } from "react";

import { formatPendingUpdatesCount, useAdminPendingUpdatesCount } from "@/lib/api";

export function AdminDocumentTitle() {
	const { data } = useAdminPendingUpdatesCount();
	const count = data?.count ?? 0;

	useEffect(() => {
		const baseTitle = "SHARE Admin";
		document.title =
			count > 0
				? `(${formatPendingUpdatesCount(count)}) ${baseTitle}`
				: baseTitle;
	}, [count]);

	return null;
}
