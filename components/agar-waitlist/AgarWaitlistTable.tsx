"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Eye, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AgarWaitlistApplication } from "@/types/agar-waitlist";
import AgarWaitlistApi from "@/lib/api/agar-waitlist";
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
	items: AgarWaitlistApplication[];
	isLoading: boolean;
	isError: boolean;
	isEmpty: boolean;
	errorMessage: string;
};

export function AgarWaitlistTable({
	items,
	isLoading,
	isError,
	isEmpty,
	errorMessage,
}: Props) {
	const router = useRouter();
	const [pendingDelete, setPendingDelete] = useState<AgarWaitlistApplication | null>(null);
	const { mutate: deleteApplication, isPending: isDeleting } =
		AgarWaitlistApi.delete.useMutation({
			onSuccess: () => setPendingDelete(null),
		});

	return (
		<div className="min-w-0 w-full rounded-2xl border border-gray-100">
			<Table>
				<TableHeader className="bg-[#D6E6F2]">
					<TableRow className="border-none hover:bg-transparent">
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-normal">
							Applicant
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-normal">
							Business
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-normal">
							Sector
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-normal">
							City
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider whitespace-normal">
							Submitted
						</TableHead>
						<TableHead className="font-bold text-[#4A5568] h-12 px-4 text-[11px] uppercase tracking-wider text-center whitespace-normal">
							Action
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={6} className="h-40 text-center">
								<Loader2 className="animate-spin inline mr-2" />
								Loading...
							</TableCell>
						</TableRow>
					) : isError ? (
						<TableRow>
							<TableCell colSpan={6} className="h-40 text-center text-sm text-red-600">
								{errorMessage}
							</TableCell>
						</TableRow>
					) : isEmpty ? (
						<TableRow>
							<TableCell colSpan={6} className="h-40 text-center text-sm text-gray-500">
								No applications found.
							</TableCell>
						</TableRow>
					) : (
						items.map((item) => (
							<TableRow
								key={item._id}
								className="hover:bg-slate-50/50 border-gray-50"
							>
								<TableCell className="px-4 py-4 text-xs font-bold text-gray-700 whitespace-normal">
									{item.fullName}
								</TableCell>
								<TableCell className="px-4 py-4 text-xs font-bold text-gray-600 whitespace-normal">
									{item.businessName}
								</TableCell>
								<TableCell className="px-4 py-4 text-xs text-gray-500 font-medium whitespace-normal">
									{item.sector}
								</TableCell>
								<TableCell className="px-4 py-4 text-xs text-gray-500 font-medium whitespace-normal">
									{item.city}
								</TableCell>
								<TableCell className="px-4 py-4 text-xs text-gray-500 font-medium whitespace-normal">
									{item.createdAt
										? format(new Date(item.createdAt), "MMM d, yyyy")
										: "-"}
								</TableCell>
								<TableCell className="px-4 py-4 text-center whitespace-normal">
									<div className="flex items-center justify-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											title="View details"
											onClick={() => router.push(`/agar-waitlist/${item._id}`)}
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
						? `This will permanently delete ${pendingDelete.fullName}'s application for ${pendingDelete.businessName}. This action cannot be undone.`
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
