"use client";

import { type ReactNode } from "react";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { type TraineeType } from "@/lib/api/trainee";
import { formatDisplayDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";

import { ResetCredentialsAction } from "./reset-credentials-action";

export function traineeFullName(t: TraineeType) {
	return [t.firstname, t.middlename, t.lastname].filter(Boolean).join(" ");
}

function normalizeIsActive(value: unknown) {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value === 1;
	if (typeof value === "string") {
		const v = value.trim().toLowerCase();
		return v === "true" || v === "1" || v === "active";
	}
	return false;
}

function SheetDetailRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex items-start justify-between gap-6 border-b border-slate-100 py-3.5 last:border-b-0">
			<span className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
				{label}
			</span>
			<div className="min-w-0 text-right text-sm font-medium text-slate-900">
				{children}
			</div>
		</div>
	);
}

interface TraineeDetailSheetProps {
	trainee: TraineeType | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function TraineeDetailSheet({
	trainee,
	open,
	onOpenChange,
}: TraineeDetailSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
			>
				{trainee && (
					<div className="flex h-full min-h-0 flex-col">
						<SheetHeader className="space-y-2 border-b border-slate-200/80 px-6 pb-5 pt-6 text-left">
							<SheetTitle className="text-xl font-bold text-slate-900">
								{traineeFullName(trainee) || "-"}
							</SheetTitle>
							<SheetDescription className="text-sm text-slate-500">
								{trainee.email || "-"}
							</SheetDescription>
							<span
								className={cn(
									"mt-1 inline-flex w-fit rounded-md px-3 py-1 text-[10px] font-bold",
									normalizeIsActive(trainee.isActive)
										? "bg-[#E6F4EA] text-[#1E8E3E]"
										: "bg-red-50 text-red-600"
								)}
							>
								{normalizeIsActive(trainee.isActive) ? "Active" : "Inactive"}
							</span>
						</SheetHeader>

						<div className="flex-1 overflow-y-auto px-6 py-5">
							<div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-1">
								<SheetDetailRow label="Phone">
									{trainee.phoneNumber || "-"}
								</SheetDetailRow>
								<SheetDetailRow label="Username">
									{trainee.username || "-"}
								</SheetDetailRow>
								<SheetDetailRow label="Type">
									{trainee.type || "-"}
								</SheetDetailRow>
								<SheetDetailRow label="Age">
									{trainee.age ?? "-"}
								</SheetDetailRow>
								<SheetDetailRow label="Gender">
									{trainee.gender || "-"}
								</SheetDetailRow>
								<SheetDetailRow label="Region">
									{trainee.region || "-"}
								</SheetDetailRow>
								<SheetDetailRow label="Education">
									{trainee.education || "-"}
								</SheetDetailRow>
								<SheetDetailRow label="Referral Code">
									{trainee.referralCode || "NONE"}
								</SheetDetailRow>
								<SheetDetailRow label="Joined">
									{formatDisplayDate(trainee.createdAt) || "-"}
								</SheetDetailRow>
							</div>

							<div className="mt-4 flex justify-end">
								<ResetCredentialsAction
									trainee={trainee}
									variant="button"
									className="h-9 w-auto gap-1.5 px-4 text-xs"
								/>
							</div>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
