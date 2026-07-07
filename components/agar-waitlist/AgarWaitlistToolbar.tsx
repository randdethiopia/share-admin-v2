import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AgarWaitlistSortMode } from "@/types/agar-waitlist";

type Props = {
	search: string;
	sort: AgarWaitlistSortMode;
	totalCount: number;
	onSearchChange: (value: string) => void;
	onSortChange: (value: AgarWaitlistSortMode) => void;
};

export function AgarWaitlistToolbar({
	search,
	sort,
	totalCount,
	onSearchChange,
	onSortChange,
}: Props) {
	return (
		<div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
			<div className="relative w-full max-w-sm">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
				<Input
					placeholder="Search name, business, email, city..."
					className="pl-11 bg-[#F3F8FF] border-none h-12 rounded-xl text-sm"
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center gap-3">
				<span className="text-xs font-bold text-gray-400">
					{totalCount} application{totalCount === 1 ? "" : "s"}
				</span>
				<Select
					value={sort}
					onValueChange={(value) => {
						if (value === "newest" || value === "oldest") {
							onSortChange(value);
						}
					}}
				>
					<SelectTrigger className="w-full sm:w-40 md:w-35 bg-[#F3F8FF] border-none h-12 rounded-xl text-xs font-bold">
						<SelectValue placeholder="Newest First" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">Newest First</SelectItem>
						<SelectItem value="oldest">Oldest First</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
