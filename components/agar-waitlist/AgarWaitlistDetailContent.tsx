import type { ReactNode } from "react";
import type { AgarWaitlistApplication } from "@/types/agar-waitlist";
import { AgarWaitlistAttachmentsGrid } from "@/components/agar-waitlist/AgarWaitlistAttachmentsGrid";

type DetailFieldProps = {
	label: string;
	value?: string | null;
	multiline?: boolean;
};

function DetailField({ label, value, multiline = false }: DetailFieldProps) {
	const display = value?.trim() || "-";

	return (
		<div className="space-y-1">
			<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
				{label}
			</p>
			<p
				className={
					multiline
						? "whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-gray-700"
						: "text-sm font-medium text-gray-700"
				}
			>
				{display}
			</p>
		</div>
	);
}

function DetailSection({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
			<div>
				<h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
					{title}
				</h2>
				{description ? (
					<p className="text-sm text-gray-500 mt-1">{description}</p>
				) : null}
			</div>
			{children}
		</section>
	);
}

type Props = {
	application: AgarWaitlistApplication;
	submittedLabel: string;
};

export function AgarWaitlistDetailContent({ application, submittedLabel }: Props) {
	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-slate-100 bg-[#F8FBFF] px-5 py-4 text-sm text-slate-600">
				Submitted on <span className="font-semibold text-slate-800">{submittedLabel}</span>
			</div>

			<AgarWaitlistAttachmentsGrid application={application} />

			<DetailSection title="Founder" description="Applicant contact and background">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField label="Full name" value={application.fullName} />
					<DetailField label="Title / role" value={application.titleRole} />
					<DetailField label="Email" value={application.email} />
					<DetailField label="Mobile" value={application.mobile} />
					<DetailField
						label="Additional phone"
						value={application.additionalPhoneNumber}
					/>
					<DetailField label="Founder gender" value={application.founderGender} />
					<DetailField label="Founder age group" value={application.founderAgeGroup} />
					<DetailField
						label="Education level"
						value={application.highestLevelOfEducation}
					/>
				</div>
			</DetailSection>

			<DetailSection title="Business" description="Company and product information">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField label="Business name" value={application.businessName} />
					<DetailField label="Sector" value={application.sector} />
					<DetailField label="Other sector" value={application.otherSector} />
					<DetailField label="City" value={application.city} />
					<DetailField
						label="Registration status"
						value={application.registrationStatus}
					/>
					<DetailField label="Date started" value={application.dateStarted} />
					<DetailField
						label="Number of employees"
						value={application.numberOfEmployees}
					/>
					<DetailField
						label="Video call platform"
						value={application.videoCallPlatform}
					/>
				</div>

				<div className="space-y-4 pt-2">
					<DetailField
						label="Mentorship focus areas"
						value={application.mentorshipFocusAreas?.join(", ")}
					/>
					<DetailField
						label="Product description"
						value={application.productDescription}
						multiline
					/>
					<DetailField
						label="Business description"
						value={application.businessDescription}
						multiline
					/>
					<DetailField
						label="Biggest challenge"
						value={application.biggestChallenge}
						multiline
					/>
					<DetailField
						label="Success description"
						value={application.successDescription}
						multiline
					/>
				</div>
			</DetailSection>

			{(application.coFounderFullName || application.coFounderEmail) && (
				<DetailSection title="Co-founder">
					<div className="grid gap-4 sm:grid-cols-2">
						<DetailField label="Co-founder name" value={application.coFounderFullName} />
						<DetailField label="Co-founder role" value={application.coFounderTitleRole} />
						<DetailField label="Co-founder email" value={application.coFounderEmail} />
						<DetailField
							label="Co-founder phone"
							value={application.coFounderPhoneNumber}
						/>
						<DetailField label="Co-founder gender" value={application.coFounderGender} />
						<DetailField
							label="Co-founder age group"
							value={application.coFounderAgeGroup}
						/>
					</div>
				</DetailSection>
			)}

			<DetailSection title="Scheduling & referral">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField
						label="Preferred meeting times"
						value={application.meetingTimes?.preferred?.join(", ")}
					/>
					<DetailField
						label="Available meeting times"
						value={application.meetingTimes?.canWork?.join(", ")}
					/>
					<DetailField label="Bi-weekly commitment" value={application.commitBiWeekly} />
					<DetailField
						label="Schedule constraints"
						value={application.scheduleConstraints}
					/>
					<DetailField label="Referral source" value={application.referralSource} />
					<DetailField
						label="Other referral source"
						value={application.referralSourceOther}
					/>
				</div>
			</DetailSection>

			<DetailSection title="Additional">
				<div className="space-y-4">
					<DetailField label="Additional info" value={application.additionalInfo} multiline />
					<DetailField label="Consent" value={application.consent ? "Yes" : "No"} />
				</div>
			</DetailSection>
		</div>
	);
}
