export const genderOptions = ["Female", "Male"] as const;
export const ageGroupOptions = ["Under 25", "25-35", "36-45", "46+"] as const;
export const educationLevelOptions = [
	"Below secondary school",
	"Secondary school (grade 12)",
	"TVET / Vocational diploma",
	"Bachelor's degree",
	"Master's degree or above",
] as const;
export const sectorOptions = [
	"Agro-processing / Agriculture",
	"Light Manufacturing",
	"Renewable Energy",
	"Textile & Apparel",
	"Leather",
	"ICT / Digital",
	"Services",
	"Other",
] as const;
export const registrationStatusOptions = [
	"Fully registered (valid trade license)",
	"Registered — license pending renewal",
	"Informal / not yet registered",
] as const;
export const numberOfEmployeesOptions = [
	"1 (solo founder)",
	"2–5",
	"6–10",
	"11–20",
	"21–50",
	"More than 50",
] as const;
export const mentorshipFocusAreasOptions = [
	"Financial management & planning",
	"Sales & marketing",
	"Business model refinement",
	"Operations & supply chain",
	"HR & team building",
	"Governance & legal compliance",
	"Access to finance / investment readiness",
	"Digital & technology adoption",
	"Export & international markets",
] as const;
export const meetingTimeOptions = [
	"Weekday morning (8am-12pm)",
	"Weekday afternoon (12pm-5pm)",
	"Weekend (any time)",
] as const;
export const commitBiWeeklyOptions = [
	"Yes, confirmed",
	"Yes, but I have some schedule constraints (please explain below)",
	"No",
] as const;
export const videoCallPlatformOptions = [
	"Zoom",
	"Google Meet",
	"Microsoft Teams",
	"I do not have access to any of these yet",
] as const;
export const referralSourceOptions = [
	"R&D Group / SHARE platform",
	"SNV LIWAY",
	"LinkedIn / social media",
	"A colleague or friend",
	"Business association or chamber of commerce",
	"Bank or microfinance institution",
	"Other",
] as const;

export type AgarGender = (typeof genderOptions)[number];
export type AgarAgeGroup = (typeof ageGroupOptions)[number];
export type AgarEducationLevel = (typeof educationLevelOptions)[number];
export type AgarSector = (typeof sectorOptions)[number];
export type AgarRegistrationStatus = (typeof registrationStatusOptions)[number];
export type AgarNumberOfEmployees = (typeof numberOfEmployeesOptions)[number];
export type AgarMentorshipFocusArea = (typeof mentorshipFocusAreasOptions)[number];
export type AgarMeetingTime = (typeof meetingTimeOptions)[number];
export type AgarCommitBiWeekly = (typeof commitBiWeeklyOptions)[number];
export type AgarVideoCallPlatform = (typeof videoCallPlatformOptions)[number];
export type AgarReferralSource = (typeof referralSourceOptions)[number];

export type AgarWaitlistSortMode = "newest" | "oldest";

export type AgarWaitlistMeetingTimes = {
	preferred: string[];
	canWork: string[];
};

export type AgarWaitlistCreateInput = {
	fullName: string;
	titleRole: string;
	email: string;
	mobile: string;
	additionalPhoneNumber?: string;
	businessName: string;
	sector: AgarSector;
	otherSector?: string;
	city: string;
	registrationStatus: AgarRegistrationStatus;
	dateStarted: string;
	numberOfEmployees?: AgarNumberOfEmployees;
	productDescription: string;
	businessDescription: string;
	biggestChallenge: string;
	successDescription: string;
	mentorshipFocusAreas?: AgarMentorshipFocusArea[];
	founderGender: AgarGender;
	founderAgeGroup: AgarAgeGroup;
	highestLevelOfEducation: AgarEducationLevel;
	coFounderFullName?: string;
	coFounderTitleRole?: string;
	coFounderEmail?: string;
	coFounderPhoneNumber?: string;
	coFounderGender?: AgarGender;
	coFounderAgeGroup?: AgarAgeGroup;
	meetingTimes?: AgarWaitlistMeetingTimes;
	commitBiWeekly: AgarCommitBiWeekly;
	scheduleConstraints?: string;
	videoCallPlatform: AgarVideoCallPlatform;
	referralSource: AgarReferralSource;
	referralSourceOther?: string;
	additionalInfo?: string;
	consent: boolean;
};

export type AgarWaitlistApplication = AgarWaitlistCreateInput & {
	_id: string;
	createdAt: string;
	__v?: number;
	photosOfBusiness?: string;
	pitchDeck?: string;
	registrationCertificate?: string;
};

export type GetAgarWaitlistResponse = AgarWaitlistApplication[];

export type AgarWaitlistAttachmentType = "image" | "document";

export type AgarWaitlistAttachment = {
	label: string;
	url: string;
	type: AgarWaitlistAttachmentType;
};
