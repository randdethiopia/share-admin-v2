import type { ReactNode } from "react";
import type { AgarMentorWaitlistApplication } from "@/types/agar-mentor-waitlist";
import { AgarMentorWaitlistAttachmentsGrid } from "@/components/agar-mentor-waitlist/AgarMentorWaitlistAttachmentsGrid";

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
	application: AgarMentorWaitlistApplication;
	submittedLabel: string;
};

export function AgarMentorWaitlistDetailContent({ application, submittedLabel }: Props) {
	return (
		<div className="space-y-6">
			<div className="rounded-2xl border border-slate-100 bg-[#F8FBFF] px-5 py-4 text-sm text-slate-600">
				Submitted on <span className="font-semibold text-slate-800">{submittedLabel}</span>
			</div>

			<AgarMentorWaitlistAttachmentsGrid application={application} />

			<DetailSection title="Contact" description="Applicant contact details">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField label="Full name" value={application.fullName} />
					<DetailField label="Preferred name / title" value={application.preferredNameTitle} />
					<DetailField label="Email" value={application.email} />
					<DetailField label="Mobile / WhatsApp" value={application.mobileWhatsApp} />
					<DetailField label="LinkedIn profile" value={application.linkedInProfileUrl} />
					<DetailField label="Gender" value={application.gender} />
				</div>
			</DetailSection>

			<DetailSection title="Profile" description="Location and mentor type">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField label="Mentor type" value={application.mentorType} />
					<DetailField label="Current city & country" value={application.currentCityAndCountry} />
					<DetailField
						label="Timezone & available hours"
						value={application.timezoneAndAvailableHours}
					/>
					<DetailField label="Travel to Ethiopia" value={application.travelToEthiopia} />
				</div>
			</DetailSection>

			<DetailSection title="Professional background">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField label="Current job title" value={application.currentJobTitle} />
					<DetailField label="Current organization" value={application.currentOrganization} />
					<DetailField
						label="Years of experience"
						value={application.yearsOfProfessionalExperience}
					/>
					<DetailField
						label="Highest education level"
						value={application.highestLevelOfEducation}
					/>
					<DetailField
						label="Areas of expertise"
						value={application.areasOfExpertise?.join(", ")}
					/>
					<DetailField
						label="Deepest experience sector"
						value={application.deepestExperienceSector}
					/>
				</div>

				<div className="space-y-4 pt-2">
					<DetailField
						label="Professional bio"
						value={application.professionalBio}
						multiline
					/>
				</div>
			</DetailSection>

			<DetailSection title="Mentoring experience & motivation">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField
						label="Previous mentorship experience"
						value={application.previousMentorshipExperience}
					/>
				</div>
				<div className="space-y-4 pt-2">
					<DetailField
						label="Business problem solved"
						value={application.businessProblemSolvedDescription}
						multiline
					/>
					<DetailField
						label="Motivation to mentor"
						value={application.motivationToMentor}
						multiline
					/>
				</div>
			</DetailSection>

			<DetailSection title="Scheduling & referral">
				<div className="grid gap-4 sm:grid-cols-2">
					<DetailField
						label="Preferred meeting time (1st choice)"
						value={application.preferredMeetingTimeFirstChoice?.join(", ")}
					/>
					<DetailField
						label="Preferred meeting time (2nd choice)"
						value={application.preferredMeetingTimeSecondChoice?.join(", ")}
					/>
					<DetailField label="Bi-weekly commitment" value={application.commitBiWeekly} />
					<DetailField label="Video call platform" value={application.videoCallPlatform} />
					<DetailField label="Referral source" value={application.referralSource} />
				</div>
			</DetailSection>

			<DetailSection title="Additional">
				<div className="space-y-4">
					<DetailField label="Anything else" value={application.anythingElse} multiline />
					<DetailField label="Consent" value={application.consent ? "Yes" : "No"} />
				</div>
			</DetailSection>
		</div>
	);
}
