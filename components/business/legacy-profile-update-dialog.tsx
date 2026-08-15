"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

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

interface LegacyProfileUpdateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/**
	 * SME *account* id, not the profile _id.
	 *
	 * The legacy endpoints behind this dialog resolve the profile with
	 * findOneAndUpdate({ smeId: id }), so passing a profile _id here makes every
	 * approve/reject 404. The newer staging endpoints accept either id; these do not.
	 */
	smeAccountId: string;
}

export function LegacyProfileUpdateDialog({
	open,
	onOpenChange,
	smeAccountId,
}: LegacyProfileUpdateDialogProps) {
	const [rejectOpen, setRejectOpen] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejectionError, setRejectionError] = useState("");

	const { mutate: approveUpdate, isPending: isApproving } =
		api.BusinessProfile.UpdateApprove.useMutation({
			onSuccess: () => {
				onOpenChange(false);
			},
		});

	const { mutate: rejectUpdate, isPending: isRejecting } =
		api.BusinessProfile.UpdateReject.useMutation({
			onSuccess: () => {
				setRejectOpen(false);
				setRejectionReason("");
				setRejectionError("");
				onOpenChange(false);
			},
		});

	const isMutating = isApproving || isRejecting;

	const handleReject = () => {
		const reason = rejectionReason.trim();
		if (!reason) {
			setRejectionError("Rejection feedback is required.");
			return;
		}
		if (reason.length < 5) {
			setRejectionError("Rejection reason must be at least 5 characters.");
			return;
		}
		setRejectionError("");
		rejectUpdate({ id: smeAccountId, reason });
	};

	return (
		<>
			<Dialog open={open && !rejectOpen} onOpenChange={onOpenChange}>
				<DialogContent showCloseButton={!isMutating} className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-agar-navy">
							Review Profile Update Request
						</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						A detailed side-by-side comparison is not available for this legacy
						update request. You can approve the pending changes to publish them, or
						reject the request with feedback for the business owner.
					</p>
					<DialogFooter className="gap-2 sm:justify-between">
						<Button
							variant="outline"
							className="border-destructive/30 text-destructive hover:bg-destructive/5"
							disabled={isMutating}
							onClick={() => {
								setRejectionReason("");
								setRejectionError("");
								setRejectOpen(true);
							}}
						>
							<X className="mr-2 h-4 w-4" />
							Reject Update
						</Button>
						<Button
							className="bg-primary font-semibold text-primary-foreground hover:bg-agar-orange-dark"
							disabled={isMutating}
							onClick={() => approveUpdate(smeAccountId)}
						>
							{isApproving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Approving…
								</>
							) : (
								<>
									<Check className="mr-2 h-4 w-4" />
									Approve Update
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={rejectOpen}
				onOpenChange={(nextOpen) => {
					setRejectOpen(nextOpen);
					if (!nextOpen) {
						setRejectionReason("");
						setRejectionError("");
					}
				}}
			>
				<DialogContent showCloseButton={!isRejecting} className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-agar-navy">Reject Profile Update</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Textarea
							value={rejectionReason}
							onChange={(event) => {
								setRejectionReason(event.target.value);
								if (rejectionError) setRejectionError("");
							}}
							placeholder="Provide rejection feedback for the business owner..."
							className="min-h-28 border-0 bg-[#F4F4F5]"
							maxLength={500}
							aria-invalid={Boolean(rejectionError)}
						/>
						{rejectionError ? (
							<p className="text-sm text-destructive">{rejectionError}</p>
						) : null}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRejectOpen(false)}
							disabled={isRejecting}
						>
							Cancel
						</Button>
						<Button
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={handleReject}
							disabled={isRejecting}
						>
							{isRejecting ? "Rejecting…" : "Confirm Rejection"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
