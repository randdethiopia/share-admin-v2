import { Search, X } from "lucide-react";

import {
	formatEnumLabel,
	hasActiveFilters,
	REASON_OPTIONS,
	type LoginLogFilters,
	type ResultFilter,
	type UserTypeFilter,
} from "./login-logs.constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type LoginLogFilterBarProps = {
	filters: LoginLogFilters;
	onChange: (patch: Partial<LoginLogFilters>) => void;
	onReset: () => void;
};

export function LoginLogFilterBar({ filters, onChange, onReset }: LoginLogFilterBarProps) {
	return (
		<div className="flex flex-wrap items-center gap-2 pb-4">
			<div className="relative w-52 shrink-0">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search phone number..."
					value={filters.search}
					onChange={(e) => onChange({ search: e.target.value })}
					className="h-10 border-0 bg-[#F4F4F5] pl-9"
				/>
			</div>

			<Select
				value={filters.userType}
				onValueChange={(value) => onChange({ userType: value as UserTypeFilter })}
			>
				<SelectTrigger className="h-10 w-32 shrink-0 border-0 bg-[#F4F4F5]" aria-label="User type">
					<SelectValue placeholder="User type" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ALL">All users</SelectItem>
					<SelectItem value="ADMIN">Admin</SelectItem>
					<SelectItem value="TRAINEE">Trainee</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.result}
				onValueChange={(value) => onChange({ result: value as ResultFilter })}
			>
				<SelectTrigger className="h-10 w-44 shrink-0 border-0 bg-[#F4F4F5]" aria-label="Result">
					<SelectValue placeholder="Result" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="ALL">All results</SelectItem>
					<SelectItem value="SUCCESS">Success</SelectItem>
					<SelectItem value="FAILED">Failed (any reason)</SelectItem>
					<SelectSeparator />
					<SelectGroup>
						<SelectLabel>Failed because</SelectLabel>
						{REASON_OPTIONS.map((option) => (
							<SelectItem key={option} value={option}>
								{formatEnumLabel(option)}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>

			<div className="flex shrink-0 items-center gap-2">
				<Input
					type="date"
					aria-label="From date"
					value={filters.from}
					max={filters.to || undefined}
					onChange={(e) => onChange({ from: e.target.value })}
					className="h-10 w-[140px] border-0 bg-[#F4F4F5]"
				/>
				<span className="text-sm text-muted-foreground">–</span>
				<Input
					type="date"
					aria-label="To date"
					value={filters.to}
					min={filters.from || undefined}
					onChange={(e) => onChange({ to: e.target.value })}
					className="h-10 w-[140px] border-0 bg-[#F4F4F5]"
				/>
			</div>

			{hasActiveFilters(filters) ? (
				<Button
					variant="ghost"
					size="icon"
					className="h-10 w-10 shrink-0"
					onClick={onReset}
					aria-label="Clear filters"
					title="Clear filters"
				>
					<X className="h-4 w-4" />
				</Button>
			) : null}
		</div>
	);
}
