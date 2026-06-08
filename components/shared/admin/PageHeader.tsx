import { cn } from "@/lib/utils";

type PageHeaderProps = {
	title: string;
	description?: string;
	className?: string;
};

export function PageHeader({ title, description, className }: PageHeaderProps) {
	return (
		<div className={cn("space-y-1", className)}>
			<h1 className="text-2xl font-semibold tracking-tight text-slate-900">
				{title}
			</h1>
			{description ? (
				<p className="text-sm text-slate-500">{description}</p>
			) : null}
		</div>
	);
}
