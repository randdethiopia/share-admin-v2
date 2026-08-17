"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";

import api, { invalidateProfileUpdateQueries } from "@/lib/api";
import type { BusinessProfileType, SmeUpdateRequestType } from "@/lib/api";
import {
	getProposedChangeKeys,
	isConflictedUpdateRequest,
	SME_PROFILE_FIELD_LABELS,
} from "@/lib/api";
import {
	getLiveProfileField,
	getProposedFieldValue,
	ProfileUpdateFieldValue,
} from "@/components/business/profile-update-field-value";
import { RejectUpdateRequestModal } from "@/components/business/reject-update-request-modal";
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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

function formatSubmittedDate(value: string) {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "Unknown date";
	return parsed.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

interface ProfileUpdateDiffDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	request: SmeUpdateRequestType;
	liveProfile: BusinessProfileType;
	profileId: string;
}

export function ProfileUpdateDiffDialog({
	open,
	onOpenChange,
	request,
	liveProfile,
	profileId,
}: ProfileUpdateDiffDialogProps) {
	const queryClient = useQueryClient();
	const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);
	const [conflictAlert, setConflictAlert] = useState(false);

	const changedKeys = useMemo(
		() => getProposedChangeKeys(request.proposedChanges),
		[request.proposedChanges]
	);

	const { mutate: approveRequest, isPending: isApproving } =
		api.BusinessProfile.approveStagingRequest.useMutation({
			onSuccess: async () => {
				await invalidateProfileUpdateQueries(queryClient, profileId);
				setConflictAlert(false);
				setApproveConfirmOpen(false);
				onOpenChange(false);
			},
			onError: (err) => {
				if (err.response?.status === 409) {
					setConflictAlert(true);
					setApproveConfirmOpen(false);
				}
			},
		});

	// The reject mutation belongs to RejectUpdateRequestModal, which owns its own
	// instance. Calling useMutation here too would create a second, unrelated
	// instance whose isPending never flips (React Query v5 tracks pending state per
	// instance), so it would report "not rejecting" for the entire rejection.
	// Treating an open reject modal as busy is both accurate and enough to stop an
	// approve being fired alongside a reject.
	const isMutating = isApproving || rejectOpen;

	const isConflicted = isConflictedUpdateRequest(request);

	useEffect(() => {
		if (!open) {
			setConflictAlert(false);
		}
	}, [open]);

	const handleApprove = () => {
		approveRequest({ requestId: request._id, profileId });
	};

	const summaryText = `${changedKeys.length} field${changedKeys.length === 1 ? "" : "s"} changed · Submitted ${formatSubmittedDate(request.requestedAt)} · Request v${request.requestVersion}`;

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					showCloseButton={!isMutating}
					className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0"
				>
					<DialogHeader className="border-b border-border px-6 py-4 text-left">
						<DialogTitle className="text-lg font-bold text-agar-navy">
							Review Proposed Profile Changes
						</DialogTitle>
						<p className="text-sm text-muted-foreground">{summaryText}</p>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto px-6 py-4">
						{conflictAlert ? (
							<div
								role="alert"
								className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
							>
								<div className="flex items-start gap-2">
									<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
									<p>
										Live profile version conflict detected. Data refreshed. Please
										re-review the updated values before approving.
									</p>
								</div>
							</div>
						) : null}

						{isConflicted ? (
							<div
								role="alert"
								className="mb-4 rounded-lg border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900"
							>
								<div className="flex items-start gap-2">
									<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
									<div>
										<p className="font-semibold">
											This request is out of date
										</p>
										<p className="mt-1">
											The live profile changed after these edits were submitted,
											so the values shown under “Current (Live)” are not what the
											SME was editing against. Each row also shows the value at
											submission time. Approving will overwrite the current live
											values.
										</p>
									</div>
								</div>
							</div>
						) : null}

						<div className="mb-3 hidden grid-cols-2 gap-4 md:grid">
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Current (Live)
							</p>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Proposed
							</p>
						</div>

						<div className="space-y-4">
							{changedKeys.map((fieldKey) => (
								<div
									key={fieldKey}
									className="rounded-xl border-0 bg-card shadow-xs overflow-hidden"
								>
									<p className="border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-agar-navy">
										{SME_PROFILE_FIELD_LABELS[fieldKey]}
									</p>
									<div className="grid grid-cols-1 gap-0 md:grid-cols-2">
										<div className="border-b border-border p-4 md:border-b-0 md:border-r">
											<p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:hidden">
												Current (Live)
											</p>
											<ProfileUpdateFieldValue
												fieldKey={fieldKey}
												value={getLiveProfileField(liveProfile, fieldKey)}
											/>
											{isConflicted ? (
												<div className="mt-3 border-t border-dashed border-amber-500/40 pt-2">
													<p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
														At submission
													</p>
													<ProfileUpdateFieldValue
														fieldKey={fieldKey}
														value={getProposedFieldValue(
															request.previousValues,
															fieldKey
														)}
													/>
												</div>
											) : null}
										</div>
										<div className="bg-[#EFF8DE] p-4">
											<p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:hidden">
												Proposed
											</p>
											<ProfileUpdateFieldValue
												fieldKey={fieldKey}
												value={getProposedFieldValue(request.proposedChanges, fieldKey)}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
						<Button
							variant="outline"
							className="border-destructive/30 text-destructive hover:bg-destructive/5"
							disabled={isMutating}
							onClick={() => setRejectOpen(true)}
						>
							<X className="mr-2 h-4 w-4" />
							Reject Request
						</Button>
						<Button
							className="bg-primary font-semibold text-primary-foreground hover:bg-agar-orange-dark"
							disabled={isMutating}
							onClick={() => setApproveConfirmOpen(true)}
						>
							{isApproving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Approving…
								</>
							) : (
								<>
									<Check className="mr-2 h-4 w-4" />
									Approve &amp; Publish Changes
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Approve and publish changes?</AlertDialogTitle>
						<AlertDialogDescription>
							This will apply the proposed profile updates to the live business
							profile immediately.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isApproving}
							onClick={(event) => {
								event.preventDefault();
								handleApprove();
							}}
						>
							{isApproving ? "Publishing…" : "Approve & Publish"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<RejectUpdateRequestModal
				open={rejectOpen}
				onOpenChange={setRejectOpen}
				requestId={request._id}
				profileId={profileId}
				onRejected={() => onOpenChange(false)}
			/>
		</>
	);
}
