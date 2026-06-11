import { AVAILABLE_FIELDS } from "@/components/wait-list/constants";
import type { ApplicantListItem } from "@/lib/api/waitlist";
import { getApplicantFullName, getApplicantNameParts } from "@/lib/applicantName";

export const CSV_EXPORT_FIELDS = [
	"firstName",
	"middleName",
	"lastName",
	"phoneNumber",
	"birthDate",
	"age",
	"email",
	"gender",
	"region",
	"city",
	"woreda",
	"zone",
	"maritalStatus",
	"hasDisability",
	"humanitarianStatus",
	"educationalBackground",
	"studySubject",
	"digitalDevices",
	"employmentStatus",
	"previousEmploymentStatus",
	"monthlyEarnings",
	"weeklyCommitment",
	"technicalDigitalSkills",
	"englishProficiency",
	"amharicProficiency",
	"participatedMasterCardFundedProgram",
	"acceptsSafeguardingConducts",
] as const;

export const CSV_EXPORT_LABELS: Record<(typeof CSV_EXPORT_FIELDS)[number], string> = {
	firstName: "First Name",
	middleName: "Middle Name",
	lastName: "Last Name",
	phoneNumber: "Phone Number",
	birthDate: "Birthdate",
	age: "Age",
	email: "Email",
	gender: "Gender",
	region: "Region",
	city: "City",
	woreda: "Woreda",
	zone: "Zone",
	maritalStatus: "Marital Status",
	hasDisability: "Do you have any disabilities?",
	humanitarianStatus: "Humanitarian Status",
	educationalBackground: "Educational Background",
	studySubject: "Study Subject",
	digitalDevices: "Digital Devices",
	employmentStatus: "Current Employment Status",
	previousEmploymentStatus: "Previous Employment Status",
	monthlyEarnings: "Monthly Earnings",
	weeklyCommitment: "Weekly Commitment",
	technicalDigitalSkills: "Technical / Digital Skills",
	englishProficiency: "English Proficiency",
	amharicProficiency: "Amharic Proficiency",
	participatedMasterCardFundedProgram:
		"Have you ever participated in any MasterCard funded program?",
	acceptsSafeguardingConducts: "Do You Accept Safeguarding Conducts?",
};

const EXPORTABLE_KEYS = new Set(AVAILABLE_FIELDS.map((f) => f.key));

const EXCLUDED_KEYS = new Set(["_id", "__v", "alreadyOnEdge", "id"]);

function csvCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (Array.isArray(value)) return value.map(String).join(", ");
	if (typeof value === "object") {
		const o = value as Record<string, unknown>;
		if (typeof o.name === "string") return o.name;
		return "";
	}
	return String(value);
}

export function getApplicantExportValue(
	applicant: ApplicantListItem,
	key: string
): string {
	if (!EXPORTABLE_KEYS.has(key) || EXCLUDED_KEYS.has(key)) return "";

	if (key === "fullName") return getApplicantFullName(applicant);

	const parts = getApplicantNameParts(applicant);
	if (key === "firstName") return parts.firstName;
	if (key === "middleName") return parts.middleName;
	if (key === "lastName") return parts.lastName;

	if (key === "city") return applicant.city?.name ?? "";
	if (key === "subcity") return applicant.subcity?.name ?? "";

	return csvCell((applicant as unknown as Record<string, unknown>)[key]);
}

export function applicantToExportRow(
	applicant: ApplicantListItem
): Record<string, string> {
	const rec: Record<string, string> = {};
	for (const field of AVAILABLE_FIELDS) {
		rec[field.key] = getApplicantExportValue(applicant, field.key);
	}
	return rec;
}

export function applicantsToCsv(
	applicants: ApplicantListItem[],
	selectedFields: string[],
	labels: Record<string, string>
): string {
	const headers = selectedFields.filter(
		(k) => EXPORTABLE_KEYS.has(k) && !EXCLUDED_KEYS.has(k)
	);
	const headerLabels = headers.map((h) => labels[h] ?? h);

	const rows = applicants.map((a) =>
		headers
			.map((h) => {
				const cell = getApplicantExportValue(a, h);
				return `"${cell.replace(/"/g, '""')}"`;
			})
			.join(",")
	);

	return [headerLabels.join(","), ...rows].join("\n");
}

export function exportApplicantsToDefaultCsv(applicants: ApplicantListItem[]): string {
	return applicantsToCsv(
		applicants,
		[...CSV_EXPORT_FIELDS],
		CSV_EXPORT_LABELS
	);
}
