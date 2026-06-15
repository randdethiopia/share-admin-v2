export type ApplicantNameSource = {
	firstName?: string | null;
	middleName?: string | null;
	lastName?: string | null;
};

export type ApplicantNameParts = {
	firstName: string;
	middleName: string;
	lastName: string;
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
		middleName: asName(applicant.middleName),
		lastName: asName(applicant.lastName),
	};
}

export function getApplicantFullName(applicant: ApplicantNameSource): string {
	const { firstName, middleName, lastName } = getApplicantNameParts(applicant);
	return [firstName, middleName, lastName].filter(Boolean).join(" ");
}
