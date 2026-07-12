"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
	ArrowLeft,
	Calendar,
	Building2,
	FileText,
	Globe,
	Image as ImageIcon,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Tag,
	User,
	ExternalLink,
} from "lucide-react";

import api from "@/lib/api";
import { useListReturnHref } from "@/hooks/use-url-pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function statusBadgeClass(status?: string) {
	switch (normalizeStatus(status)) {
		case "APPROVED":
			return "bg-brand-success/15 text-brand-success";
		case "REJECTED":
			return "bg-brand-danger/15 text-brand-danger";
		case "DRAFT":
			return "bg-slate-100 text-slate-600";
		case "PENDING":
		default:
			return "bg-brand-pending/15 text-brand-pending";
	}
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

function BusinessDetailPageInner() {
	const params = useParams();
	const listHref = useListReturnHref("/business");
	const id = useMemo(() => {
		const raw = (params as { id?: string | string[] })?.id;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const {
		data: business,
		isLoading,
		isError,
		error,
	} = api.BusinessProfile.GetById.useQuery(id ?? "", {
		queryKey: ["BusinessProfile", id ?? ""],
		enabled: Boolean(id),
	});

	if (!id) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="mx-auto max-w-6xl rounded-3xl border border-blue-50 bg-white p-6 shadow-sm">
					<p className="text-sm font-semibold text-red-600">Missing business id.</p>
					<Button variant="outline" className="mt-4 rounded-xl" asChild>
						<Link href={listHref}>Back to list</Link>
					</Button>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="mx-auto flex h-64 max-w-6xl items-center justify-center">
					<Loader2 className="h-10 w-10 animate-spin text-blue-600" />
				</div>
			</div>
		);
	}

	if (isError || !business) {
		const message =
			(error as { response?: { data?: { message?: string } } })?.response?.data
				?.message || "Business profile not found.";

		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="mx-auto max-w-6xl rounded-3xl border border-blue-50 bg-white p-6 shadow-sm">
					<p className="text-center text-sm font-semibold text-red-600">{message}</p>
					<div className="mt-4 flex justify-center">
						<Button variant="outline" className="rounded-xl" asChild>
							<Link href={listHref}>Back to list</Link>
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const status = normalizeStatus(business.status);
	const updateStatus = normalizeStatus(business.updateStatus);
	const categories = Array.isArray(business.categories) ? business.categories : [];
	const socialNetwork = Array.isArray(business.socialNetwork)
		? business.socialNetwork
		: [];
	const gallery = Array.isArray(business.gallery) ? business.gallery : [];
	const attachments = Array.isArray(business.attachment) ? business.attachment : [];

	return (
		<div className="min-h-screen bg-[#E2EDF8] px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
				<div className="flex flex-col gap-3 rounded-3xl border border-blue-50 bg-white p-6 shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<Link
							href={listHref}
							className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
						>
							<ArrowLeft size={14} /> Back to list
						</Link>
						<div className="flex flex-wrap items-center gap-2">
							<Badge
								className={cn(
									"rounded-md border-none px-3 py-1 text-[10px] font-bold shadow-none",
									statusBadgeClass(status)
								)}
							>
								{status || "PENDING"}
							</Badge>
							{updateStatus ? (
								<Badge className="rounded-md border-none bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700 shadow-none">
									Update: {updateStatus}
								</Badge>
							) : null}
						</div>
					</div>

					<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
						<Avatar className="h-24 w-24 border-4 border-white shadow-lg">
							<AvatarImage src={business.avatar?.url} />
							<AvatarFallback className="bg-blue-600 text-2xl font-bold text-white">
								{getAvatarFallback(business.businessName || business.name)}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
								Business profile
							</p>
							<h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
								{business.businessName || business.name || "Business"}
							</h1>
							<p className="mt-2 text-sm text-slate-600">
								{business.description || "No description provided."}
							</p>
						</div>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					<Card className="rounded-3xl border-none shadow-sm lg:col-span-2">
						<CardContent className="space-y-6 p-6 md:p-8">
							<div>
								<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
									<Building2 className="h-5 w-5 text-blue-600" /> Core details
								</h2>
								<div className="mt-4 grid gap-4 sm:grid-cols-2">
									<DetailItem icon={<User className="h-4 w-4" />} label="Owner">
										{business.name || `${business.smeId?.firstName ?? ""} ${business.smeId?.lastName ?? ""}`.trim() || "-"}
									</DetailItem>
									<DetailItem icon={<Mail className="h-4 w-4" />} label="Email">
										{business.email || "-"}
									</DetailItem>
									<DetailItem icon={<Phone className="h-4 w-4" />} label="Phone">
										{business.bphoneNumber || "-"}
									</DetailItem>
									<DetailItem icon={<Globe className="h-4 w-4" />} label="Website">
										{business.website ? (
											<a
												href={business.website}
												target="_blank"
												rel="noreferrer"
												className="inline-flex items-center gap-1 text-blue-600 hover:underline"
											>
												Visit site <ExternalLink className="h-3.5 w-3.5" />
											</a>
										) : (
											"-"
										)}
									</DetailItem>
									<DetailItem icon={<MapPin className="h-4 w-4" />} label="Address">
										{business.address || "-"}
									</DetailItem>
									<DetailItem icon={<Calendar className="h-4 w-4" />} label="Registered">
										{formatDate(business.dateOfRegistration)}
									</DetailItem>
									<DetailItem icon={<Tag className="h-4 w-4" />} label="Industry">
										{business.industry || "-"}
									</DetailItem>
									<DetailItem icon={<Tag className="h-4 w-4" />} label="Staff size">
										{business.staffSize || "-"}
									</DetailItem>
									<DetailItem icon={<Tag className="h-4 w-4" />} label="Revenue range">
										{business.revenueRange || "-"}
									</DetailItem>
								</div>
							</div>

							<div className="border-t border-slate-100 pt-6">
								<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
									<FileText className="h-5 w-5 text-blue-600" /> Description
								</h2>
								<p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
									{business.description || "No description provided."}
								</p>
							</div>
						</CardContent>
					</Card>

					<div className="space-y-6">
						<Card className="rounded-3xl border-none shadow-sm">
							<CardContent className="space-y-4 p-6">
								<h2 className="text-lg font-bold text-slate-900">Categories</h2>
								<div className="flex flex-wrap gap-2">
									{categories.length ? (
										categories.map((category) => (
											<Badge
												key={category}
												className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-none"
											>
												{category}
											</Badge>
										))
									) : (
										<p className="text-sm text-slate-500">No categories provided.</p>
									)}
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-3xl border-none shadow-sm">
							<CardContent className="space-y-4 p-6">
								<h2 className="text-lg font-bold text-slate-900">Social links</h2>
								<div className="space-y-3">
									{socialNetwork.length ? (
										socialNetwork.map((entry) => (
											<div key={`${entry.name}-${entry.link}`} className="rounded-2xl bg-slate-50 p-3">
												<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
													{entry.name}
												</p>
												<a
													href={entry.link}
													target="_blank"
													rel="noreferrer"
													className="mt-1 inline-flex break-all text-sm font-medium text-blue-600 hover:underline"
												>
													{entry.link}
												</a>
											</div>
										))
									) : (
										<p className="text-sm text-slate-500">No social links provided.</p>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<Card className="rounded-3xl border-none shadow-sm">
						<CardContent className="space-y-4 p-6">
							<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
								<ImageIcon className="h-5 w-5 text-blue-600" /> Gallery
							</h2>
							{gallery.length ? (
								<div className="grid gap-3 sm:grid-cols-2">
									{gallery.map((file, index) => (
										<a
											key={`${file?.url ?? index}`}
											href={file?.url}
											target="_blank"
											rel="noreferrer"
											className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
										>
											<img
												src={file?.url}
												alt={`Gallery ${index + 1}`}
												className="h-40 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
											/>
										</a>
									))}
								</div>
							) : (
								<p className="text-sm text-slate-500">No gallery images available.</p>
							)}
						</CardContent>
					</Card>

					<Card className="rounded-3xl border-none shadow-sm">
						<CardContent className="space-y-4 p-6">
							<h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
								<FileText className="h-5 w-5 text-blue-600" /> Documents
							</h2>
							<div className="space-y-4">
								<DocumentLink label="Company profile" url={getFileUrl(business.companyProfile)} />
								<DocumentLink label="Business license" url={getFileUrl(business.businessLicense || business.bussinessLicense)} />
								<div>
									<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attachments</p>
									{attachments.length ? (
										<div className="mt-2 space-y-2">
											{attachments.map((file, index) => (
												<DocumentLink
													key={`${file?.url ?? index}`}
													label={`Attachment ${index + 1}`}
													url={file?.url ?? ""}
												/>
											))}
										</div>
									) : (
										<p className="mt-2 text-sm text-slate-500">No attachments provided.</p>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function DetailItem({
	icon,
	label,
	children,
}: {
	icon: React.ReactNode;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl bg-slate-50 p-4">
			<p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
				{icon} {label}
			</p>
			<p className="mt-2 wrap-break-word text-sm font-medium text-slate-800">{children}</p>
		</div>
	);
}

function DocumentLink({ label, url }: { label: string; url: string }) {
	return (
		<div className="rounded-2xl bg-slate-50 p-4">
			<p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
			{url ? (
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="mt-2 inline-flex items-center gap-1 break-all text-sm font-medium text-blue-600 hover:underline"
				>
					Open file <ExternalLink className="h-3.5 w-3.5" />
				</a>
			) : (
				<p className="mt-2 text-sm text-slate-500">Not provided.</p>
			)}
		</div>
	);
}

export default function BusinessDetailPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
					<div className="mx-auto flex h-64 max-w-6xl items-center justify-center">
						<Loader2 className="h-10 w-10 animate-spin text-blue-600" />
					</div>
				</div>
			}
		>
			<BusinessDetailPageInner />
		</Suspense>
	);
}