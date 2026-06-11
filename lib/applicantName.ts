export type ApplicantNameSource = {
	firstName?: string | null;
	fatherName?: string | null;
	GrandFatherName?: string | null;
};

export type ApplicantNameParts = {
	firstName: string;
	fatherName: string;
	GrandFatherName: string;
};

function asName(value: unknown): string {
	if (value === null || value === undefined) return "";
	return String(value).trim();
}

export function getApplicantNameParts(
	applicant: ApplicantNameSource
): ApplicantNameParts {
	return {
		firstName: asName(applicant.firstName),
		fatherName: asName(applicant.fatherName),
		GrandFatherName: asName(applicant.GrandFatherName),
	};
}

export function getApplicantFullName(applicant: ApplicantNameSource): string {
	const { firstName, fatherName, GrandFatherName } =
		getApplicantNameParts(applicant);
	return [firstName, fatherName, GrandFatherName].filter(Boolean).join(" ");
}
