export type AgarMentorWaitlistSortMode = "newest" | "oldest";

export type AgarMentorWaitlistGenderSortMode = "none" | "asc" | "desc";

export type AgarMentorWaitlistApplication = {
	_id: string;
	fullName: string;
	preferredNameTitle?: string;
	email: string;
	mobileWhatsApp: string;
	linkedInProfileUrl?: string;
	gender: string;
	mentorType: string;
	currentCityAndCountry: string;
	timezoneAndAvailableHours?: string;
	travelToEthiopia?: string;
	currentJobTitle: string;
	currentOrganization: string;
	yearsOfProfessionalExperience: string;
	highestLevelOfEducation: string;
	professionalBio?: string;
	areasOfExpertise?: string[];
	deepestExperienceSector?: string;
	previousMentorshipExperience?: string;
	businessProblemSolvedDescription?: string;
	motivationToMentor?: string;
	preferredMeetingTimeFirstChoice?: string[];
	preferredMeetingTimeSecondChoice?: string[];
	commitBiWeekly?: string;
	videoCallPlatform?: string;
	cvResumeUrl?: string;
	professionalPhotoUrl?: string;
	portfolioOrReferenceUrl?: string;
	referralSource?: string;
	anythingElse?: string;
	consent: boolean;
	createdAt: string;
	__v?: number;
};

export type GetAgarMentorWaitlistResponse = AgarMentorWaitlistApplication[];

export type AgarMentorWaitlistDashboardStats = {
	totalApplications: number;
	applicationsOverTime: { _id: string; count: number }[];
	mentorTypeDistribution: { _id: string; count: number }[];
	areasOfExpertise: { _id: string; count: number }[];
	genderDistribution: { _id: string; count: number }[];
	yearsOfExperience: { _id: string; count: number }[];
};

export type AgarMentorWaitlistAttachmentType = "image" | "document";

export type AgarMentorWaitlistAttachment = {
	label: string;
	url: string;
	type: AgarMentorWaitlistAttachmentType;
};
