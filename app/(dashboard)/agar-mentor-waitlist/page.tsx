"use client";

import { AgarMentorWaitlistHeader } from "@/components/agar-mentor-waitlist/AgarMentorWaitlistHeader";
import { AgarMentorWaitlistTable } from "@/components/agar-mentor-waitlist/AgarMentorWaitlistTable";
import { AgarMentorWaitlistToolbar } from "@/components/agar-mentor-waitlist/AgarMentorWaitlistToolbar";
import PaginationControls from "@/components/shared/PaginationControls";
import { useAgarMentorWaitlist } from "@/hooks/useAgarMentorWaitlist";

export default function AgarMentorWaitlistPage() {
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
	} = useAgarMentorWaitlist();

	return (
		<div className="w-full min-w-0 space-y-6">
			<AgarMentorWaitlistHeader />

			<div className="w-full min-w-0 rounded-3xl md:rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 md:p-10 min-h-[70vh]">
				<AgarMentorWaitlistToolbar
					search={search}
					sort={sort}
					totalCount={filteredData.length}
					onSearchChange={handleSearchChange}
					onSortChange={handleSortChange}
				/>

				<AgarMentorWaitlistTable
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
