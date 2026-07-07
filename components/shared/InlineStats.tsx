"use client";

import type { ComponentType } from "react";

export type InlineStatItem = {
	title: string;
	value: number | string;
	icon: ComponentType<{ className?: string }>;
};

type Props = {
	items: InlineStatItem[];
};

function StatItem({ title, value, icon: Icon }: InlineStatItem) {
	return (
		<div className="inline-flex items-center gap-2">
			<Icon className="h-4 w-4 shrink-0 text-slate-400" />
			<span className="text-xs font-medium text-gray-400">{title}</span>
			<span className="text-base font-bold text-gray-800">{value}</span>
		</div>
	);
}

export function InlineStats({ items }: Props) {
	return (
		<div className="mb-4 flex flex-wrap items-center justify-end gap-4 pr-4">
			{items.map((item) => (
				<StatItem key={item.title} {...item} />
			))}
		</div>
	);
}
