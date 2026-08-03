import { Search } from "lucide-react";

import {
	CATEGORY_FILTER_OPTIONS,
	STATUS_FILTER_OPTIONS,
	type CategoryFilter,
	type StatusFilter,
} from "@/components/support/support.constants";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

function formatFilterLabel(value: string) {
	return value
		.split("_")
		.map((part) => part.charAt(0) + part.slice(1).toLowerCase())
		.join(" ");
}

type SupportFilterBarProps = {
	search: string;
	onSearchChange: (value: string) => void;
	status: StatusFilter;
	onStatusChange: (value: StatusFilter) => void;
	category: CategoryFilter;
	onCategoryChange: (value: CategoryFilter) => void;
};

export function SupportFilterBar({
	search,
	onSearchChange,
	status,
	onStatusChange,
	category,
	onCategoryChange,
}: SupportFilterBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<div className="relative">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search tickets..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="h-10 w-72 border-0 bg-[#F4F4F5] pl-9"
				/>
			</div>

			<Select
				value={status}
				onValueChange={(value) => onStatusChange(value as StatusFilter)}
			>
				<SelectTrigger className="h-10 w-40 border-0 bg-[#F4F4F5]">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					{STATUS_FILTER_OPTIONS.map((option) => (
						<SelectItem key={option} value={option}>
							{formatFilterLabel(option)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={category}
				onValueChange={(value) => onCategoryChange(value as CategoryFilter)}
			>
				<SelectTrigger className="h-10 w-48 border-0 bg-[#F4F4F5]">
					<SelectValue placeholder="Category" />
				</SelectTrigger>
				<SelectContent>
					{CATEGORY_FILTER_OPTIONS.map((option) => (
						<SelectItem key={option} value={option}>
							{formatFilterLabel(option)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
