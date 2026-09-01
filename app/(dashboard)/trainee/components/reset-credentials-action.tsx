"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { hasAllAccessPermission, normalizePermissions } from "@/lib/access";
import TraineeAuth, { type TraineeType } from "@/lib/api/trainee";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";

function traineeDisplayName(t: TraineeType) {
	return [t.firstname, t.middlename, t.lastname].filter(Boolean).join(" ");
}

interface ResetCredentialsActionProps {
	trainee: TraineeType;
	variant?: "icon" | "button";
	className?: string;
}

export function ResetCredentialsAction({
	trainee,
	variant = "icon",
	className,
}: ResetCredentialsActionProps) {
	const [open, setOpen] = useState(false);

	const permissions = useAuthStore((s) => s.permissions);
	const canResetCredentials =
		hasAllAccessPermission(permissions) ||
		normalizePermissions(permissions).includes("trainee.write");

	const { mutate, isPending } = TraineeAuth.ResetCredentials.useMutation({
		onSuccess: () => setOpen(false),
		onError: (err) => {
			if (err.response?.status === 404) setOpen(false);
		},
	});

	if (!canResetCredentials) return null;

	return (
		<>
			{variant === "icon" ? (
				<Button
					variant="link"
					onClick={() => setOpen(true)}
					className={cn(
						"h-auto p-0 text-[10px] font-bold text-amber-600",
						className
					)}
				>
					Reset Credentials
				</Button>
			) : (
				<Button
					variant="outline"
					onClick={() => setOpen(true)}
					className={cn(
						"w-full justify-center gap-2 rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50",
						className
					)}
				>
					<RotateCcw size={16} />
					Reset Credentials
				</Button>
			)}

			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent className="rounded-3xl sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-xl font-bold">
							Reset credentials
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will invalidate {traineeDisplayName(trainee) || "this trainee"}&apos;s
							current password and send a new one via SMS to{" "}
							<span className="font-semibold text-slate-900">
								{trainee.phoneNumber || trainee.username || "their registered phone number"}
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl" disabled={isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={(e) => {
								e.preventDefault();
								mutate(trainee._id);
							}}
							className="rounded-xl bg-amber-600 hover:bg-amber-700"
						>
							{isPending ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 className="animate-spin" size={16} />
									Please wait
								</span>
							) : (
								"Reset Credentials"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
