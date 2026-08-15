"use client";

import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";

import type {
	BusinessProfileType,
	FounderStoryType,
	SmeProfileUpdateFieldKey,
	SmeProfileUpdateRequestPayload,
	SocialType,
	TeamMemberType,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FileType } from "@/types/core";

function formatDate(value?: string) {
	if (!value) return "-";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "-";
	return parsed.toLocaleDateString();
}

function getFileUrl(file?: FileType | null) {
	return file?.url?.trim() ?? "";
}

function ScalarValue({ value }: { value?: string }) {
	const text = value?.trim();
	return <span className="text-sm text-foreground">{text || "-"}</span>;
}

function CategoriesValue({ categories }: { categories?: string[] }) {
	const items = Array.isArray(categories) ? categories.filter(Boolean) : [];
	if (!items.length) {
		return <span className="text-sm text-muted-foreground">-</span>;
	}
	return (
		<div className="flex flex-wrap gap-2">
			{items.map((category) => (
				<Badge
					key={category}
					variant="outline"
					className="border-primary/30 bg-agar-orange-light text-agar-orange-dark"
				>
					{category}
				</Badge>
			))}
		</div>
	);
}

function SocialNetworkValue({ entries }: { entries?: SocialType[] }) {
	const items = Array.isArray(entries) ? entries : [];
	if (!items.length) {
		return <span className="text-sm text-muted-foreground">-</span>;
	}
	return (
		<div className="space-y-2">
			{items.map((entry) => (
				<div
					key={`${entry.name}-${entry.link}`}
					className="rounded-lg border-0 bg-[#F4F4F5] p-3"
				>
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						{entry.name}
					</p>
					<a
						href={entry.link}
						target="_blank"
						rel="noreferrer"
						className="mt-0.5 inline-flex items-center gap-1 break-all text-sm font-medium text-primary hover:underline"
					>
						<Globe className="h-3.5 w-3.5 shrink-0" />
						{entry.link}
						<ExternalLink className="h-3 w-3 shrink-0" />
					</a>
				</div>
			))}
		</div>
	);
}

function SingleMediaValue({ file, label }: { file?: FileType; label: string }) {
	const url = getFileUrl(file);
	if (!url) {
		return <span className="text-sm text-muted-foreground">-</span>;
	}
	const isImage = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
	return (
		<div className="space-y-2">
			{isImage ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={url}
					alt={label}
					className="h-20 w-20 rounded-lg border border-border object-cover"
				/>
			) : null}
			<Button variant="outline" size="sm" className="w-fit" asChild>
				<Link href={url} target="_blank" rel="noreferrer">
					View {label}
					<ExternalLink className="ml-1.5 h-3.5 w-3.5" />
				</Link>
			</Button>
		</div>
	);
}

function MediaGalleryValue({ files, label }: { files?: FileType[]; label: string }) {
	const items = Array.isArray(files) ? files.filter((file) => getFileUrl(file)) : [];
	if (!items.length) {
		return <span className="text-sm text-muted-foreground">-</span>;
	}
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{items.map((file, index) => {
				const url = getFileUrl(file);
				const isImage = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
				return (
					<div key={`${url}-${index}`} className="space-y-1.5">
						{isImage ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={url}
								alt={`${label} ${index + 1}`}
								className="h-16 w-full rounded-lg border border-border object-cover"
							/>
						) : null}
						<Button variant="outline" size="sm" className="h-8 w-full text-xs" asChild>
							<Link href={url} target="_blank" rel="noreferrer">
								Open
							</Link>
						</Button>
					</div>
				);
			})}
		</div>
	);
}

function FounderStoryValue({ story }: { story?: FounderStoryType }) {
	const content = story?.content?.trim();
	const coverImage = story?.coverImage;

	if (!content && !getFileUrl(coverImage)) {
		return <span className="text-sm text-muted-foreground">-</span>;
	}

	return (
		<div className="space-y-3">
			{content ? (
				<p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
					{content}
				</p>
			) : null}
			{coverImage ? (
				<SingleMediaValue file={coverImage} label="Cover Image" />
			) : null}
		</div>
	);
}

function TeamsValue({ members }: { members?: TeamMemberType[] }) {
	const items = Array.isArray(members) ? members.filter((member) => member.name?.trim()) : [];
	if (!items.length) {
		return <span className="text-sm text-muted-foreground">-</span>;
	}

	return (
		<div className="space-y-2">
			{items.map((member, index) => {
				const avatarUrl = getFileUrl(member.avatar);
				return (
					<div
						key={`${member.name}-${member.title}-${index}`}
						className="flex items-start gap-3 rounded-lg border-0 bg-[#F4F4F5] p-3"
					>
						{avatarUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={avatarUrl}
								alt={member.name}
								className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
							/>
						) : null}
						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-foreground">{member.name}</p>
							<p className="text-sm text-muted-foreground">
								{member.title?.trim() || "-"}
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function getLiveProfileField(
	profile: BusinessProfileType,
	key: SmeProfileUpdateFieldKey
): SmeProfileUpdateRequestPayload[SmeProfileUpdateFieldKey] {
	if (key === "businessLicense") {
		return profile.businessLicense ?? profile.bussinessLicense;
	}
	return profile[key];
}

export function getProposedFieldValue(
	proposedChanges: SmeProfileUpdateRequestPayload,
	key: SmeProfileUpdateFieldKey
): SmeProfileUpdateRequestPayload[SmeProfileUpdateFieldKey] {
	return proposedChanges[key];
}

export function ProfileUpdateFieldValue({
	fieldKey,
	value,
}: {
	fieldKey: SmeProfileUpdateFieldKey;
	value: SmeProfileUpdateRequestPayload[SmeProfileUpdateFieldKey];
}) {
	switch (fieldKey) {
		case "categories":
			return <CategoriesValue categories={value as string[] | undefined} />;
		case "socialNetwork":
			return <SocialNetworkValue entries={value as SocialType[] | undefined} />;
		case "avatar":
			return <SingleMediaValue file={value as FileType | undefined} label="Avatar" />;
		case "companyProfile":
			return (
				<SingleMediaValue
					file={value as FileType | undefined}
					label="Company Profile"
				/>
			);
		case "businessLicense":
			return (
				<SingleMediaValue
					file={value as FileType | undefined}
					label="Business License"
				/>
			);
		case "attachment":
			return (
				<MediaGalleryValue
					files={value as FileType[] | undefined}
					label="Attachment"
				/>
			);
		case "founderStory":
			return <FounderStoryValue story={value as FounderStoryType | undefined} />;
		case "teams":
			return <TeamsValue members={value as TeamMemberType[] | undefined} />;
		case "gallery":
			return (
				<MediaGalleryValue files={value as FileType[] | undefined} label="Gallery" />
			);
		case "dateOfRegistration":
			return <ScalarValue value={formatDate(value as string | undefined)} />;
		case "website":
			if (typeof value === "string" && value.trim()) {
				return (
					<a
						href={value}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
					>
						{value}
						<ExternalLink className="h-3.5 w-3.5" />
					</a>
				);
			}
			return <ScalarValue value={value as string | undefined} />;
		default:
			return <ScalarValue value={value as string | undefined} />;
	}
}
