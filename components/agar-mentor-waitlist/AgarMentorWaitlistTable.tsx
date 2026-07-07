"use client";

import { useState } from "react";
import { ArrowUpDown, Eye, FileText, Linkedin, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type {
	AgarMentorWaitlistApplication,
	AgarMentorWaitlistGenderSortMode,
} from "@/types/agar-mentor-waitlist";
import AgarMentorWaitlistApi from "@/lib/api/agar-mentor-waitlist";
import { AgarWaitlistConfirmationModal } from "@/components/agar-waitlist/AgarWaitlistConfirmationModal";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type Props = {
	items: AgarMentorWaitlistApplication[];
	genderSort: AgarMentorWaitlistGenderSortMode;
	onGenderSortChange: (value: AgarMentorWaitlistGenderSortMode) => void;
	isLoading: boolean;
	isError: boolean;
	isEmpty: boolean;
	errorMessage: string;
};

export function AgarMentorWaitlistTable({
	items,
	genderSort,
	onGenderSortChange,
	isLoading,
	isError,
	isEmpty,
	errorMessage,
}: Props) {
	const router = useRouter();
	const [pendingDelete, setPendingDelete] =
		useState<AgarMentorWaitlistApplication | null>(null);
	const { mutate: deleteApplication, isPending: isDeleting } =
		AgarMentorWaitlistApi.delete.useMutation({
			onSuccess: () => setPendingDelete(null),
		});

	return (
		<div className="min-w-0 w-full rounded-2xl border border-gray-100">
			<Table>
				<TableHeader className="bg-[#D6E6F2]">
					<TableRow className="border-none hover:bg-transparent">
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-nowrap">
							Full name
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-normal">
							Email
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-normal">
							Mobile / WhatsApp
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider text-center whitespace-nowrap w-16">
							LinkedIn
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-3 text-[11px] uppercase tracking-wider text-center whitespace-nowrap w-24">
							<div className="inline-flex items-center justify-center gap-1">
								<span>Gender</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									title={
										genderSort === "asc"
											? "Sorted ascending"
											: genderSort === "desc"
												? "Sorted descending"
												: "Sort by gender"
									}
									onClick={() => {
										if (genderSort === "none") onGenderSortChange("asc");
										else if (genderSort === "asc") onGenderSortChange("desc");
										else onGenderSortChange("none");
									}}
									className={`h-6 w-6 shrink-0 rounded-md hover:bg-white/60 ${
										genderSort === "none"
											? "text-[#4A5568]/60"
											: "text-[#3B82F6]"
									}`}
								>
									<ArrowUpDown className="h-3.5 w-3.5" />
								</Button>
							</div>
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider text-center whitespace-nowrap w-16">
							CV
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider text-center whitespace-normal">
							Action
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={7} className="h-40 text-center">
								<Loader2 className="animate-spin inline mr-2" />
								Loading...
							</TableCell>
						</TableRow>
					) : isError ? (
						<TableRow>
							<TableCell colSpan={7} className="h-40 text-center text-sm text-red-600">
								{errorMessage}
							</TableCell>
						</TableRow>
					) : isEmpty ? (
						<TableRow>
							<TableCell colSpan={7} className="h-40 text-center text-sm text-gray-500">
								No applications found.
							</TableCell>
						</TableRow>
					) : (
						items.map((item) => (
							<TableRow
								key={item._id}
								className="hover:bg-slate-50/50 border-gray-50"
							>
								<TableCell className="px-4 py-4 text-xs font-bold text-gray-700 whitespace-nowrap">
									{item.fullName}
								</TableCell>
								<TableCell className="px-4 py-4 text-xs text-gray-500 font-medium whitespace-normal">
									{item.email}
								</TableCell>
								<TableCell className="px-4 py-4 text-xs text-gray-500 font-medium whitespace-normal">
									{item.mobileWhatsApp}
								</TableCell>
								<TableCell className="px-4 py-4 text-center whitespace-nowrap w-16">
									{item.linkedInProfileUrl?.trim() ? (
										<a
											href={item.linkedInProfileUrl}
											target="_blank"
											rel="noopener noreferrer"
											title="Open LinkedIn profile"
											className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#0A66C2] hover:bg-blue-100"
										>
											<Linkedin size={16} />
										</a>
									) : (
										<span className="text-xs text-gray-400">-</span>
									)}
								</TableCell>
								<TableCell className="px-3 py-4 text-xs text-gray-500 font-medium text-center whitespace-nowrap w-24">
									{item.gender}
								</TableCell>
								<TableCell className="px-4 py-4 text-center whitespace-nowrap w-16">
									{item.cvResumeUrl?.trim() ? (
										<a
											href={item.cvResumeUrl}
											target="_blank"
											rel="noopener noreferrer"
											title="Open CV / Resume"
											className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
										>
											<FileText size={16} />
										</a>
									) : (
										<span className="text-xs text-gray-400">-</span>
									)}
								</TableCell>
								<TableCell className="px-4 py-4 text-center whitespace-normal">
									<div className="flex items-center justify-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											title="View details"
											onClick={() =>
												router.push(`/agar-mentor-waitlist/${item._id}`)
											}
											className="h-8 w-8 rounded-lg bg-[#EBF5FF] text-[#3B82F6] hover:bg-blue-100"
										>
											<Eye size={16} />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											title="Delete application"
											disabled={isDeleting}
											onClick={() => setPendingDelete(item)}
											className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
										>
											<Trash2 size={16} />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<AgarWaitlistConfirmationModal
				open={Boolean(pendingDelete)}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				title="Delete application?"
				description={
					pendingDelete
						? `This will permanently delete ${pendingDelete.fullName}'s mentor application. This action cannot be undone.`
						: ""
				}
				isPending={isDeleting}
				onConfirm={() => {
					if (pendingDelete) deleteApplication(pendingDelete._id);
				}}
			/>
		</div>
	);
}
