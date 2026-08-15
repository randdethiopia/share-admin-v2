"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

interface RejectUpdateRequestModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	requestId: string;
	profileId: string;
	onRejected?: () => void;
}

export function RejectUpdateRequestModal({
	open,
	onOpenChange,
	requestId,
	profileId,
	onRejected,
}: RejectUpdateRequestModalProps) {
	const [rejectionReason, setRejectionReason] = useState("");
	const [error, setError] = useState("");

	const { mutate: rejectRequest, isPending } =
		api.BusinessProfile.rejectStagingRequest.useMutation({
			onSuccess: () => {
				setRejectionReason("");
				setError("");
				onOpenChange(false);
				onRejected?.();
			},
		});

	// Length is measured on the trimmed value because that is what gets sent, and
	// what the backend re-validates with the same 5–500 bounds.
	const trimmedLength = rejectionReason.trim().length;
	const isReasonValid =
		trimmedLength >= MIN_REASON_LENGTH && trimmedLength <= MAX_REASON_LENGTH;

	const handleSubmit = () => {
		const trimmed = rejectionReason.trim();
		if (trimmed.length < MIN_REASON_LENGTH) {
			setError(`Rejection reason must be at least ${MIN_REASON_LENGTH} characters.`);
			return;
		}
		if (trimmed.length > MAX_REASON_LENGTH) {
			setError(`Rejection reason must be at most ${MAX_REASON_LENGTH} characters.`);
			return;
		}
		setError("");
		rejectRequest({ requestId, profileId, rejectionReason: trimmed });
	};

	const closeAndReset = (nextOpen: boolean) => {
		onOpenChange(nextOpen);
		if (!nextOpen) {
			setRejectionReason("");
			setError("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={closeAndReset}>
			<DialogContent showCloseButton={!isPending} className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-agar-navy">Reject Profile Update</DialogTitle>
				</DialogHeader>
				<div className="space-y-2">
					<Textarea
						value={rejectionReason}
						onChange={(event) => {
							setRejectionReason(event.target.value);
							if (error) setError("");
						}}
						placeholder="Explain why this update request is being rejected..."
						className="min-h-28 border-0 bg-[#F4F4F5]"
						maxLength={MAX_REASON_LENGTH}
						aria-invalid={Boolean(error)}
					/>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{trimmedLength}/{MAX_REASON_LENGTH}</span>
						<span>Minimum {MIN_REASON_LENGTH} characters</span>
					</div>
					{error ? <p className="text-sm text-destructive">{error}</p> : null}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => closeAndReset(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						className="bg-destructive text-white hover:bg-destructive/90"
						onClick={handleSubmit}
						disabled={isPending || !isReasonValid}
					>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Rejecting…
							</>
						) : (
							"Confirm Rejection"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
