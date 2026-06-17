"use client";

import { AgarWaitlistHeader } from "@/components/agar-waitlist/AgarWaitlistHeader";
import { AgarWaitlistTable } from "@/components/agar-waitlist/AgarWaitlistTable";
import { AgarWaitlistToolbar } from "@/components/agar-waitlist/AgarWaitlistToolbar";
import PaginationControls from "@/components/shared/PaginationControls";
import { useAgarWaitlist } from "@/hooks/useAgarWaitlist";

export default function AgarWaitlistPage() {
	const {
		search,
		sort,
		page,
		pageSize,
		pageData,
		filteredData,
		isLoading,
		isError,
		errorMessage,
		setPage,
		handleSearchChange,
		handleSortChange,
	} = useAgarWaitlist();

	return (
		<div className="w-full min-w-0 space-y-6">
			<AgarWaitlistHeader />

			<div className="w-full min-w-0 rounded-3xl md:rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 md:p-10 min-h-[70vh]">
				<AgarWaitlistToolbar
					search={search}
					sort={sort}
					totalCount={filteredData.length}
					onSearchChange={handleSearchChange}
					onSortChange={handleSortChange}
				/>

				<AgarWaitlistTable
					items={pageData}
					isLoading={isLoading}
					isError={isError}
					isEmpty={filteredData.length === 0}
					errorMessage={errorMessage}
				/>

				<PaginationControls
					page={page}
					onPageChange={setPage}
					totalItems={filteredData.length}
					pageSize={pageSize}
					disabled={isLoading || isError}
				/>
			</div>
		</div>
	);
}
