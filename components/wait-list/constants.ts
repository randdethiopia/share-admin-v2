export type AvailableField = {
	key: string;
	label: string;
	category: string;
};

// Add/extend fields as needed for your waitlist applicant shape.
export const AVAILABLE_FIELDS: AvailableField[] = [
	{ key: "fullName", label: "Full Name", category: "Personal" },
	{ key: "email", label: "Email", category: "Personal" },
	{ key: "phoneNumber", label: "Phone Number", category: "Personal" },
	{ key: "age", label: "Age", category: "Personal" },
	{ key: "sex", label: "Gender", category: "Personal" },
	{ key: "maritalStatus", label: "Marital Status", category: "Personal" },
	{ key: "hasDisability", label: "Has Disability", category: "Personal" },
	{ key: "disabilityDetails", label: "Disability Details", category: "Personal" },
	{ key: "digitalDevices", label: "Digital Devices", category: "Personal" },

	{ key: "currentEmploymentStatus", label: "Current Employment", category: "Employment" },
	{ key: "otherCurrentEmployment", label: "Other Current Employment", category: "Employment" },
	{ key: "previousEmploymentStatus", label: "Previous Employment", category: "Employment" },
	{ key: "otherPreviousEmployment", label: "Other Previous Employment", category: "Employment" },
	{ key: "monthlyEarnings", label: "Monthly Earnings", category: "Employment" },

	{ key: "hasComputerAccess", label: "Computer Access", category: "Technical" },
	{ key: "weeklyCommitment", label: "Weekly Commitment", category: "Technical" },
	{ key: "computerSkill", label: "Computer Skill", category: "Technical" },
	{ key: "internetSkill", label: "Internet Skill", category: "Technical" },
	{ key: "mediaSkill", label: "Media Skill", category: "Technical" },
	{ key: "englishProficiency", label: "English Proficiency", category: "Technical" },
	{ key: "amharicProficiency", label: "Amharic Proficiency", category: "Technical" },

	{ key: "prevMasterCardMember", label: "Previous MasterCard Member", category: "Other" },
	{ key: "doYouAcceptSafeguardingConducts", label: "Accepts Safeguarding Conducts", category: "Other" },

	{ key: "educationLevel", label: "Education Level", category: "Education" },
	{ key: "studySubject", label: "Study Subject", category: "Education" },
	{ key: "region", label: "Region", category: "Location" },
	{ key: "subcity", label: "Subcity", category: "Location" },
	{ key: "woreda", label: "Woreda", category: "Location" },
	{ key: "zone", label: "Zone", category: "Location" },
	{ key: "batch", label: "Batch", category: "Program" },
	{ key: "stage", label: "Stage", category: "Program" },
	{ key: "createdAt", label: "Created At", category: "Meta" },
];
