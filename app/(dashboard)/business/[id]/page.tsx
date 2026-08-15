"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
	ArrowLeft,
	Check,
	ExternalLink,
	FileText,
	Globe,
	Loader2,
	MapPin,
	Phone,
	User,
	X,
} from "lucide-react";

import api, { isReviewableUpdateRequest } from "@/lib/api";
import type { BusinessProfileType } from "@/lib/api";
import { ProfileUpdateDiffDialog } from "@/components/business/profile-update-diff-dialog";
import { LegacyProfileUpdateDialog } from "@/components/business/legacy-profile-update-dialog";
import { useListReturnHref } from "@/hooks/use-url-pagination";
import { StatusBadge } from "@/components/shared/admin/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function formatDate(value?: string) {
	if (!value) return "-";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "-";
	return parsed.toLocaleDateString();
}

function getFileUrl(file: unknown) {
	if (!file) return "";
	if (typeof file === "string") return file;
	if (Array.isArray(file)) {
		const first = file[0] as { url?: string } | undefined;
		return first?.url ?? "";
	}
	return (file as { url?: string }).url ?? "";
}

function getAvatarFallback(name?: string) {
	if (!name) return "B";
	return name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function getBusinessOwnerName(business: BusinessProfileType) {
	const ownerName = business.name?.trim();
	if (ownerName) return ownerName;

	const firstName = business.smeId?.firstName?.trim() ?? "";
	const lastName = business.smeId?.lastName?.trim() ?? "";
	return `${firstName} ${lastName}`.trim() || "-";
}

function getBusinessActionVisibility(status?: string) {
	const normalized = normalizeStatus(status);
	return {
		showApprove: normalized === "PENDING" || normalized === "REJECTED",
		showReject: normalized === "PENDING" || normalized === "APPROVED",
	};
}

function getLocationSubtitle(business: BusinessProfileType) {
	const industry = business.industry?.trim();
	const address = business.address?.trim();
	if (industry && address) return `${industry} · ${address}`;
	if (industry) return industry;
	if (address) return address;
	return "Location not provided";
}

function PageShell({ children }: { children: React.ReactNode }) {
	return <div className="w-full space-y-6">{children}</div>;
}

function LoadingState() {
	return (
		<PageShell>
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-10 w-10 animate-spin text-agar-navy" />
			</div>
		</PageShell>
	);
}

function MetricCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-card rounded-xl border-0 shadow-xs p-4 text-left">
			<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</p>
			<p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
		</div>
	);
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				{label}
			</p>
			<div className="text-sm font-medium text-foreground">{value}</div>
		</div>
	);
}

function DocumentCard({ label, url }: { label: string; url: string }) {
	const attached = Boolean(url);

	return (
		<div className="flex w-full flex-col gap-4 bg-card rounded-xl border-0 shadow-xs p-6 text-left">
			<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
				<FileText className="h-6 w-6 text-agar-navy" />
			</div>
			<div className="space-y-2">
				<p className="text-sm font-semibold text-foreground">{label}</p>
				<Badge variant={attached ? "success" : "secondary"}>
					{attached ? "ATTACHED" : "MISSING"}
				</Badge>
			</div>
			{attached ? (
				<Button variant="outline" size="sm" className="w-fit" asChild>
					<a href={url} target="_blank" rel="noreferrer">
						View Document
						<ExternalLink className="ml-1.5 h-3.5 w-3.5" />
					</a>
				</Button>
			) : (
				<Button variant="outline" size="sm" className="w-fit" disabled>
					View Document
					<ExternalLink className="ml-1.5 h-3.5 w-3.5" />
				</Button>
			)}
		</div>
	);
}

type AuditEvent = {
	title: string;
	date: string;
	description?: string;
};

function buildAuditEvents(business: BusinessProfileType): AuditEvent[] {
	const events: AuditEvent[] = [];

	if (business.dateOfRegistration) {
		events.push({
			title: "Registered",
			date: formatDate(business.dateOfRegistration),
			description: "Business profile registration submitted.",
		});
	}

	const status = normalizeStatus(business.status);
	if (
		(status === "APPROVED" || status === "REJECTED") &&
		business.approvedAt
	) {
		events.push({
			title: `Application ${status === "APPROVED" ? "approved" : "rejected"}`,
			date: formatDate(business.approvedAt),
			description: `Status changed to ${status}.`,
		});
	} else if (status) {
		events.push({
			title: "Current status",
			date: formatDate(business.approvedAt || business.dateOfRegistration),
			description: `Application is ${status}.`,
		});
	}

	const updateStatus = normalizeStatus(business.updateStatus);
	if (updateStatus) {
		events.push({
			title: "Profile update",
			date: formatDate(business.approvedAt || business.dateOfRegistration),
			description: `Update status: ${updateStatus.replace(/_/g, " ")}.`,
		});
	}

	return events;
}

function AuditTimeline({ business }: { business: BusinessProfileType }) {
	const events = buildAuditEvents(business);

	if (events.length === 0) {
		return (
			<div className="w-full bg-card rounded-xl border-0 shadow-xs p-6 text-left">
				<p className="text-sm text-muted-foreground">No audit events available.</p>
			</div>
		);
	}

	return (
		<div className="w-full bg-card rounded-xl border-0 shadow-xs p-6 text-left">
			<div className="space-y-0">
				{events.map((event, index) => (
					<div
						key={`${event.title}-${index}`}
						className="relative flex gap-4 pb-8 last:pb-0"
					>
						{index < events.length - 1 ? (
							<span
								className="absolute left-[7px] top-4 h-[calc(100%-8px)] w-px bg-border"
								aria-hidden
							/>
						) : null}
						<span
							className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background"
							aria-hidden
						/>
						<div className="min-w-0 flex-1 space-y-1">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm font-semibold text-agar-navy">{event.title}</p>
								<p className="text-xs text-muted-foreground">{event.date}</p>
							</div>
							{event.description ? (
								<p className="text-sm text-muted-foreground">{event.description}</p>
							) : null}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function BusinessDetailPageInner() {
	const params = useParams();
	const listHref = useListReturnHref("/business");
	const id = useMemo(() => {
		const raw = (params as { id?: string | string[] })?.id;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const [rejectOpen, setRejectOpen] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [rejectionError, setRejectionError] = useState("");
	const [diffDialogOpen, setDiffDialogOpen] = useState(false);

	const {
		data: business,
		isLoading,
		isError,
		error,
	} = api.BusinessProfile.GetById.useQuery(id ?? "", {
		queryKey: ["BusinessProfile", id ?? ""],
		enabled: Boolean(id),
	});

	const {
		data: pendingUpdateData,
		refetch: refetchPendingUpdate,
		isFetching: isFetchingPendingUpdate,
		isError: isPendingUpdateError,
	} = api.BusinessProfile.pendingUpdateRequest.useQuery(id ?? "", {
		enabled: Boolean(id),
	});

	const reviewableRequest =
		pendingUpdateData?.request &&
		isReviewableUpdateRequest(pendingUpdateData.request)
			? pendingUpdateData.request
			: undefined;

	const { mutate: approveBusiness, isPending: isApproving } =
		api.BusinessProfile.Approve.useMutation();
	const { mutate: rejectBusiness, isPending: isRejecting } =
		api.BusinessProfile.Reject.useMutation({
			onSuccess: () => {
				setRejectOpen(false);
				setRejectionReason("");
				setRejectionError("");
			},
		});

	const isMutating = isApproving || isRejecting;

	const openRejectDialog = () => {
		setRejectionReason("");
		setRejectionError("");
		setRejectOpen(true);
	};

	const handleConfirmRejection = () => {
		if (!id) return;
		const reason = rejectionReason.trim();
		if (!reason) {
			setRejectionError("Rejection feedback is required.");
			return;
		}
		rejectBusiness({ id, reason });
	};

	const handleReviewUpdateClick = async () => {
		await refetchPendingUpdate();
		setDiffDialogOpen(true);
	};

	if (!id) {
		return (
			<PageShell>
				<div className="w-full bg-card rounded-xl border-0 shadow-xs p-6 text-left">
					<p className="text-sm font-semibold text-destructive">Missing business id.</p>
					<Button variant="outline" className="mt-4" asChild>
						<Link href={listHref}>Back to list</Link>
					</Button>
				</div>
			</PageShell>
		);
	}

	if (isLoading) {
		return <LoadingState />;
	}

	if (isError || !business) {
		const message =
			(error as { response?: { data?: { message?: string } } })?.response?.data
				?.message || "Business profile not found.";

		return (
			<PageShell>
				<div className="w-full bg-card rounded-xl border-0 shadow-xs p-6 text-left">
					<p className="text-sm font-semibold text-destructive">{message}</p>
					<Button variant="outline" className="mt-4 w-fit" asChild>
						<Link href={listHref}>Back to list</Link>
					</Button>
				</div>
			</PageShell>
		);
	}

	const updateStatus = normalizeStatus(business.updateStatus);
	const liveProfileForDiff = pendingUpdateData?.liveProfile ?? business;
	const hasStagingDiff = Boolean(reviewableRequest && liveProfileForDiff);
	// Two independent signals mean "something is awaiting review": a staged
	// SmeUpdateRequest (the new system) and the legacy updateStatus flag. They are
	// written by different code paths and neither reads the other, so the banner
	// shows if either is set.
	const showUpdateBanner = hasStagingDiff || updateStatus === "PENDING";
	const { showApprove, showReject } = getBusinessActionVisibility(business.status);
	const categories = Array.isArray(business.categories) ? business.categories : [];
	const socialNetwork = Array.isArray(business.socialNetwork)
		? business.socialNetwork
		: [];
	const attachments = Array.isArray(business.attachment) ? business.attachment : [];
	const tradeLicenseUrl = getFileUrl(
		business.businessLicense || business.bussinessLicense
	);
	const companyProfileUrl = getFileUrl(business.companyProfile);
	const eyebrow = categories[0] || "Business";
	const ownerEmail = business.email?.trim();

	return (
		<PageShell>
			{isPendingUpdateError ? (
				<div
					role="alert"
					className="mb-6 rounded-xl border-l-4 border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-xs"
				>
					Could not load the profile update request for this business. Any pending
					changes may not be shown — refresh to try again.
				</div>
			) : null}

			{showUpdateBanner ? (
				<div
					role="status"
					aria-live="polite"
					className="mb-6 flex flex-col gap-3 rounded-xl border-0 border-l-4 border-amber-500 bg-amber-50/90 p-4 text-amber-900 shadow-xs sm:flex-row sm:items-center sm:justify-between"
				>
					<p>This business has a pending profile update request.</p>
					<Button
						onClick={handleReviewUpdateClick}
						disabled={isFetchingPendingUpdate}
					>
						{isFetchingPendingUpdate ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading…
							</>
						) : (
							"Review Proposed Changes"
						)}
					</Button>
				</div>
			) : null}

			{reviewableRequest && liveProfileForDiff ? (
				<ProfileUpdateDiffDialog
					open={diffDialogOpen}
					onOpenChange={setDiffDialogOpen}
					request={reviewableRequest}
					liveProfile={liveProfileForDiff}
					profileId={id}
				/>
			) : null}

			<LegacyProfileUpdateDialog
				open={
					diffDialogOpen &&
					showUpdateBanner &&
					!reviewableRequest &&
					updateStatus === "PENDING"
				}
				onOpenChange={setDiffDialogOpen}
				smeAccountId={business.smeId?._id ?? ""}
			/>

			<Dialog
				open={rejectOpen}
				onOpenChange={(open) => {
					setRejectOpen(open);
					if (!open) {
						setRejectionReason("");
						setRejectionError("");
					}
				}}
			>
				<DialogContent showCloseButton={!isRejecting}>
					<DialogHeader>
						<DialogTitle className="text-agar-navy">
							Reject Business Application
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Textarea
							value={rejectionReason}
							onChange={(e) => {
								setRejectionReason(e.target.value);
								if (rejectionError) setRejectionError("");
							}}
							placeholder="Provide rejection feedback for the business owner..."
							className="min-h-28 border-0 bg-[#F4F4F5]"
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
							onClick={handleConfirmRejection}
							disabled={isRejecting}
						>
							{isRejecting ? "Rejecting…" : "Confirm Rejection"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="w-full space-y-6 bg-card rounded-xl border-0 shadow-xs p-6 text-left">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link
						href={listHref}
						className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
					>
						<ArrowLeft size={14} /> Back to list
					</Link>
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge status={business.status} />
						{updateStatus ? (
							<Badge variant="secondary" className="text-[10px] font-bold uppercase">
								Update: {updateStatus.replace(/_/g, " ")}
							</Badge>
						) : null}
					</div>
				</div>

				<div className="flex flex-col gap-5 sm:flex-row sm:items-start">
					<Avatar className="h-20 w-20 border-2 border-border shadow-sm">
						<AvatarImage src={business.avatar?.url} />
						<AvatarFallback className="bg-agar-navy text-xl font-bold text-white">
							{getAvatarFallback(business.businessName || business.name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 space-y-2">
						<p className="text-xs font-semibold uppercase tracking-wider text-primary">
							{eyebrow}
						</p>
						<h1 className="truncate text-2xl font-bold text-agar-navy">
							{business.businessName || business.name || "Business"}
						</h1>
						<p className="text-sm text-muted-foreground">
							{getLocationSubtitle(business)}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
					{showApprove ? (
						<Button
							className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-agar-orange-dark"
							disabled={isMutating}
							onClick={() => approveBusiness(business._id)}
						>
							<Check className="h-4 w-4" />
							{isApproving ? "Approving…" : "Approve Business"}
						</Button>
					) : null}
					{showReject ? (
						<Button
							className="flex items-center gap-2 rounded-md bg-destructive px-5 py-2.5 font-semibold text-white hover:bg-destructive/90"
							disabled={isMutating}
							onClick={openRejectDialog}
						>
							<X className="h-4 w-4" />
							Reject Business
						</Button>
					) : null}
				</div>
			</div>

			<Tabs defaultValue="overview" className="w-full space-y-6">
				<TabsList className="h-auto w-full rounded-lg bg-muted p-1 sm:w-fit">
					<TabsTrigger
						value="overview"
						className="data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-xs"
					>
						Overview
					</TabsTrigger>
					<TabsTrigger
						value="documents"
						className="data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-xs"
					>
						Documents & Licenses
					</TabsTrigger>
					<TabsTrigger
						value="founder"
						className="data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-xs"
					>
						Founder Story
					</TabsTrigger>
					<TabsTrigger
						value="audit"
						className="data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-xs"
					>
						Audit Trail
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-0 space-y-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
						<MetricCard label="Industry" value={business.industry || "-"} />
						<MetricCard label="Staff Size" value={business.staffSize || "-"} />
						<MetricCard
							label="Revenue Range"
							value={business.revenueRange || "-"}
						/>
						<MetricCard
							label="Registration Date"
							value={formatDate(business.dateOfRegistration)}
						/>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
						<div className="lg:col-span-2 space-y-6 bg-card rounded-xl border-0 shadow-xs p-6 text-left">
							<h2 className="text-sm font-semibold uppercase tracking-wider text-agar-navy">
								Owner & Business Details
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								<InfoField
									label="Name"
									value={
										<span className="inline-flex items-center gap-1.5">
											<User className="h-3.5 w-3.5 text-muted-foreground" />
											{getBusinessOwnerName(business)}
										</span>
									}
								/>
								<InfoField
									label="Email"
									value={
										ownerEmail ? (
											<a
												href={`mailto:${ownerEmail}`}
												className="text-primary hover:underline"
											>
												{ownerEmail}
											</a>
										) : (
											"-"
										)
									}
								/>
								<InfoField
									label="Phone"
									value={
										<span className="inline-flex items-center gap-1.5">
											<Phone className="h-3.5 w-3.5 text-muted-foreground" />
											{business.bphoneNumber || "-"}
										</span>
									}
								/>
								<InfoField
									label="Address"
									value={
										<span className="inline-flex items-start gap-1.5">
											<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											{business.address || "-"}
										</span>
									}
								/>
							</div>
							<div className="border-t border-border pt-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Business Description
								</p>
								<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
									{business.description || "No description provided."}
								</p>
							</div>
						</div>

						<div className="lg:col-span-1 space-y-6 bg-card rounded-xl border-0 shadow-xs p-6 text-left">
							<h2 className="text-sm font-semibold uppercase tracking-wider text-agar-navy">
								Categories & Links
							</h2>
							<div className="space-y-3">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Categories
								</p>
								<div className="flex flex-wrap gap-2">
									{categories.length ? (
										categories.map((category) => (
											<Badge
												key={category}
												variant="outline"
												className="border-primary/30 bg-agar-orange-light text-agar-orange-dark"
											>
												{category}
											</Badge>
										))
									) : (
										<p className="text-sm text-muted-foreground">
											No categories provided.
										</p>
									)}
								</div>
							</div>
							<div className="space-y-3 border-t border-border pt-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Website & Social
								</p>
								{business.website ? (
									<a
										href={business.website}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
									>
										<Globe className="h-4 w-4" />
										{business.website}
										<ExternalLink className="h-3.5 w-3.5" />
									</a>
								) : (
									<p className="text-sm text-muted-foreground">No website provided.</p>
								)}
								{socialNetwork.length ? (
									<div className="space-y-2">
										{socialNetwork.map((entry) => (
											<div
												key={`${entry.name}-${entry.link}`}
												className="bg-[#F4F4F5] p-3.5 rounded-lg border-0"
											>
												<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
													{entry.name}
												</p>
												<a
													href={entry.link}
													target="_blank"
													rel="noreferrer"
													className="mt-0.5 inline-flex break-all text-sm font-medium text-primary hover:underline"
												>
													{entry.link}
												</a>
											</div>
										))}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										No social links provided.
									</p>
								)}
							</div>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="documents" className="mt-0">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
						<DocumentCard label="Trade License" url={tradeLicenseUrl} />
						<DocumentCard label="Company Profile" url={companyProfileUrl} />
						{attachments.length ? (
							attachments.map((file, index) => (
								<DocumentCard
									key={`${file?.url ?? index}`}
									label={`Attachment ${index + 1}`}
									url={file?.url ?? ""}
								/>
							))
						) : (
							<DocumentCard label="Attachments" url="" />
						)}
					</div>
				</TabsContent>

				<TabsContent value="founder" className="mt-0">
					<div className="w-full bg-card rounded-xl border-0 shadow-xs p-6 text-left">
						<h2 className="text-sm font-semibold uppercase tracking-wider text-agar-navy">
							Founder Story
						</h2>
						<p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
							{business.description?.trim() || "No founder story provided."}
						</p>
					</div>
				</TabsContent>

				<TabsContent value="audit" className="mt-0">
					<AuditTimeline business={business} />
				</TabsContent>
			</Tabs>
		</PageShell>
	);
}

export default function BusinessDetailPage() {
	return (
		<Suspense fallback={<LoadingState />}>
			<BusinessDetailPageInner />
		</Suspense>
	);
}
