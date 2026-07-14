import { TRAINING_STATUS_DEFINITIONS } from "./training-status-definitions";

export function TrainingStatusGuide() {
	return (
		<div className="flex h-full flex-col justify-center space-y-5">
			<p className="text-sm text-muted-foreground">
				Every trainee is counted in exactly one category below.
			</p>
			<ul className="space-y-4">
				{TRAINING_STATUS_DEFINITIONS.map((item) => (
					<li key={item.key} className="flex gap-3">
						<span
							className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
							style={{ backgroundColor: item.color }}
							aria-hidden
						/>
						<div>
							<p className="text-sm font-medium text-foreground">{item.label}</p>
							<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
								{item.description}
							</p>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

type TrainingStatusLegendProps = {
	getValue?: (key: (typeof TRAINING_STATUS_DEFINITIONS)[number]["key"]) => string;
};

export function TrainingStatusLegend({ getValue }: TrainingStatusLegendProps) {
	return (
		<div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
			{TRAINING_STATUS_DEFINITIONS.map((item) => (
				<div
					key={item.key}
					className="flex items-center gap-2 text-sm text-foreground"
				>
					<span
						className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
						style={{ backgroundColor: item.color }}
						aria-hidden
					/>
					<span>
						{item.shortLabel}
						{getValue ? (
							<span className="ml-1.5 font-semibold tabular-nums">
								{getValue(item.key)}
							</span>
						) : null}
					</span>
				</div>
			))}
		</div>
	);
}
