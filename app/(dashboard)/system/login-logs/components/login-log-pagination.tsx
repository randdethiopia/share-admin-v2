import { PAGE_SIZE_OPTIONS } from "./login-logs.constants";
import PaginationControls from "@/components/shared/PaginationControls";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type LoginLogPaginationProps = {
	page: number;
	pageSize: number;
	totalItems: number;
	disabled?: boolean;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
};

export function LoginLogPagination({
	page,
	pageSize,
	totalItems,
	disabled,
	onPageChange,
	onPageSizeChange,
}: LoginLogPaginationProps) {
	if (totalItems <= 0) return null;

	const showingFrom = (page - 1) * pageSize + 1;
	const showingTo = Math.min(page * pageSize, totalItems);

	return (
		<div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span>
					Showing <span className="font-semibold">{showingFrom}</span>-
					<span className="font-semibold">{showingTo}</span> of{" "}
					<span className="font-semibold">{totalItems}</span>
				</span>
				<Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
					<SelectTrigger
						className="h-8 w-[110px] border-0 bg-[#F4F4F5] text-xs"
						aria-label="Rows per page"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{PAGE_SIZE_OPTIONS.map((option) => (
							<SelectItem key={option} value={String(option)}>
								{option} / page
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<PaginationControls
				className="mt-0"
				page={page}
				onPageChange={onPageChange}
				totalItems={totalItems}
				pageSize={pageSize}
				showRange={false}
				disabled={disabled}
			/>
		</div>
	);
}
