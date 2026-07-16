import type {
	AgarMentorWaitlistApplication,
	AgarMentorWaitlistAttachment,
} from "@/types/agar-mentor-waitlist";
import { ExternalLink, FileText } from "lucide-react";

function isImageUrl(url: string) {
	return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function getAttachmentType(url: string): AgarMentorWaitlistAttachment["type"] {
	return isImageUrl(url) ? "image" : "document";
}

function getAttachments(
	application: AgarMentorWaitlistApplication,
): AgarMentorWaitlistAttachment[] {
	const items: AgarMentorWaitlistAttachment[] = [];

	if (application.professionalPhotoUrl) {
		items.push({
			label: "Professional photo",
			url: application.professionalPhotoUrl,
			type: getAttachmentType(application.professionalPhotoUrl),
		});
	}

	if (application.cvResumeUrl) {
		items.push({
			label: "CV / Resume",
			url: application.cvResumeUrl,
			type: getAttachmentType(application.cvResumeUrl),
		});
	}

	if (application.portfolioOrReferenceUrl) {
		items.push({
			label: "Portfolio or reference",
			url: application.portfolioOrReferenceUrl,
			type: getAttachmentType(application.portfolioOrReferenceUrl),
		});
	}

	return items;
}

function DocumentCard({ label, url }: { label: string; url: string }) {
	return (
		<a
			href={url}
			target="_blank"
			rel="noreferrer"
			className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-[#F8FBFF] p-6 text-center shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
		>
			<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition group-hover:ring-blue-100">
				<FileText className="h-8 w-8 text-blue-500" />
			</div>
			<div className="space-y-1">
				<p className="text-sm font-semibold text-gray-800">{label}</p>
				<p className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
					Open document
					<ExternalLink className="h-3 w-3" />
				</p>
			</div>
		</a>
	);
}

type Props = {
	application: AgarMentorWaitlistApplication;
};

export function AgarMentorWaitlistAttachmentsGrid({ application }: Props) {
	const attachments = getAttachments(application);

	if (attachments.length === 0) return null;

	const images = attachments.filter((item) => item.type === "image");
	const documents = attachments.filter((item) => item.type === "document");

	return (
		<section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
			<div>
				<h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
					Attachments
				</h2>
				<p className="mt-1 text-sm text-gray-500">
					Uploaded CV, photo, and portfolio documents
				</p>
			</div>

			{images.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2">
					{images.map((item) => (
						<div
							key={`${item.label}-${item.url}`}
							className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
						>
							<div className="border-b border-slate-100 bg-[#F8FBFF] px-4 py-3">
								<p className="text-sm font-semibold text-gray-800">{item.label}</p>
							</div>
							<div className="aspect-[4/3] bg-slate-50">
								<img
									src={item.url}
									alt={item.label}
									className="h-full w-full object-cover"
								/>
							</div>
						</div>
					))}
				</div>
			)}

			{documents.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{documents.map((item) => (
						<DocumentCard key={`${item.label}-${item.url}`} label={item.label} url={item.url} />
					))}
				</div>
			)}
		</section>
	);
}
