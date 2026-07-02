type LegendItem = {
	color: string;
	label: string;
};

type ChartLegendProps = {
	items: LegendItem[];
};

export function ChartLegend({ items }: ChartLegendProps) {
	return (
		<div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
			{items.map((item) => (
				<span key={item.label} className="flex items-center gap-1">
					<span
						className="inline-block h-2.5 w-2.5 rounded-sm"
						style={{ backgroundColor: item.color }}
						aria-hidden
					/>
					{item.label}
				</span>
			))}
		</div>
	);
}
