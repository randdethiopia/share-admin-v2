import type {
	ApplicantDigitalDevice,
	ApplicantDisabilityType,
	ApplicantEducationalBackground,
	ApplicantEmploymentStatus,
	ApplicantMaritalStatus,
} from "./waitlist";


export const MARITAL_STATUS_LABELS: Record<ApplicantMaritalStatus, string> = {
	SGL: "Single",
	MRD: "Married",
	DIV: "Divorced",
	WID: "Widowed",
	PNS: "Prefer not to say",
};

export const DISABILITY_TYPE_LABELS: Record<ApplicantDisabilityType, string> = {
	IPD: "Intellectual disability",
	LDI: "Learning disability",
	SPI: "Speech impairment",
	PHD: "Physical disability",
	HI: "Hearing impairment",
	VI: "Visual impairment",
};

export const DIGITAL_DEVICE_LABELS: Record<ApplicantDigitalDevice, string> = {
	SP: "Smartphone",
	TAB: "Tablet",
	LAP: "Laptop",
};

export const EDUCATIONAL_BACKGROUND_LABELS: Record<
	ApplicantEducationalBackground,
	string
> = {
	NFE: "No formal education",
	PS: "Primary school",
	MS: "Middle school",
	SS: "Secondary school",
	VTT: "Vocational training (TVET)",
	VTD: "Vocational training (Diploma)",
	CUD: "University (Diploma)",
	CUB: "University (Bachelor's)",
	CUM: "University (Master's)",
	CUDR: "University (Doctorate)",
	PC: "Professional certification",
};

export const EMPLOYMENT_STATUS_LABELS: Record<ApplicantEmploymentStatus, string> = {
	EFT: "Employed full-time",
	EPT: "Employed part-time",
	SE: "Self-employed",
	UNE: "Unemployed",
	STU: "Student",
	OTH: "Other",
};


function lookup<K extends string>(
	dict: Record<K, string>,
	value: K | string | null | undefined
): string {
	if (value === null || value === undefined || value === "") return "";
	return (dict as Record<string, string>)[value as string] ?? String(value);
}

export const formatMaritalStatus = (
	raw: ApplicantMaritalStatus | string | null | undefined
) => lookup(MARITAL_STATUS_LABELS, raw);

export const formatDisabilityType = (
	raw: ApplicantDisabilityType | string | null | undefined
) => lookup(DISABILITY_TYPE_LABELS, raw);

export const formatEducationalBackground = (
	raw: ApplicantEducationalBackground | string | null | undefined
) => lookup(EDUCATIONAL_BACKGROUND_LABELS, raw);

export const formatEmploymentStatus = (
	raw: ApplicantEmploymentStatus | string | null | undefined
) => lookup(EMPLOYMENT_STATUS_LABELS, raw);

export function formatDigitalDevices(
	devices: ApplicantDigitalDevice[] | string[] | null | undefined
): string {
	if (!Array.isArray(devices) || devices.length === 0) return "";
	return devices
		.map((d) => (DIGITAL_DEVICE_LABELS as Record<string, string>)[d] ?? d)
		.join(", ");
}
