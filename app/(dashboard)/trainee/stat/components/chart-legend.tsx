type LegendItem = {
	color: string;
	label?: string;
	name?: string;
	value?: string;
};

type ChartLegendProps = {
	items: LegendItem[];
};

export function ChartLegend({ items }: ChartLegendProps) {
	return (
		<div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
			{items.map((item) => (
				<div
					key={item.label ?? `${item.name}-${item.value}`}
					className="flex items-center gap-2 text-sm text-foreground"
				>
					<span
						className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
						style={{ backgroundColor: item.color }}
						aria-hidden
					/>
					{item.name ? (
						<span>
							{item.name}
							{item.value ? (
								<span className="ml-1.5 font-semibold tabular-nums">{item.value}</span>
							) : null}
						</span>
					) : (
						<span>{item.label}</span>
					)}
				</div>
			))}
		</div>
	);
}
