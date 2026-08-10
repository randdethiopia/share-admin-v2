import type { GetTicketsQueryParams } from "./support.types";

export const supportKeys = {
	all: ["support"] as const,
	list: (params?: GetTicketsQueryParams) =>
		[...supportKeys.all, "list", params] as const,
	detail: (id: string) => [...supportKeys.all, "detail", id] as const,
};
