export type AvailableField = {
	key: string;
	label: string;
	category: string;
};


export const AVAILABLE_FIELDS: AvailableField[] = [
	{ key: "fullName", label: "Full Name", category: "Personal" },
	{ key: "firstName", label: "First Name", category: "Personal" },
	{ key: "middleName", label: "Middle Name", category: "Personal" },
	{ key: "lastName", label: "Last Name", category: "Personal" },
	{ key: "email", label: "Email", category: "Personal" },
	{ key: "phoneNumber", label: "Phone Number", category: "Personal" },
	{ key: "age", label: "Age", category: "Personal" },
	{ key: "birthDate", label: "Birth Date", category: "Personal" },
	{ key: "gender", label: "Gender", category: "Personal" },
	{ key: "maritalStatus", label: "Marital Status", category: "Personal" },
	{ key: "hasDisability", label: "Has Disability", category: "Personal" },
	{ key: "disabilityType", label: "Disability Type", category: "Personal" },
	{ key: "digitalDevices", label: "Digital Devices", category: "Personal" },
	{ key: "humanitarianStatus", label: "Humanitarian Status", category: "Personal" },

	{ key: "employmentStatus", label: "Current Employment", category: "Employment" },
	{ key: "previousEmploymentStatus", label: "Previous Employment", category: "Employment" },
	{ key: "monthlyEarnings", label: "Monthly Earnings", category: "Employment" },

	{ key: "weeklyCommitment", label: "Weekly Commitment", category: "Technical" },
	{ key: "technicalDigitalSkills", label: "Technical Digital Skills", category: "Technical" },
	{ key: "englishProficiency", label: "English Proficiency", category: "Technical" },
	{ key: "amharicProficiency", label: "Amharic Proficiency", category: "Technical" },

	{
		key: "participatedMasterCardFundedProgram",
		label: "Participated in MasterCard-funded Program",
		category: "Other",
	},
	{
		key: "acceptsSafeguardingConducts",
		label: "Accepts Safeguarding Conducts",
		category: "Other",
	},

	{ key: "educationalBackground", label: "Educational Background", category: "Education" },
	{ key: "studySubject", label: "Study Subject", category: "Education" },

	{ key: "region", label: "Region", category: "Location" },
	{ key: "city", label: "City", category: "Location" },
	{ key: "subcity", label: "Subcity", category: "Location" },
	{ key: "woreda", label: "Woreda", category: "Location" },
	{ key: "zone", label: "Zone", category: "Location" },

	{ key: "batch", label: "Batch", category: "Program" },
	{ key: "stage", label: "Stage", category: "Program" },

	{ key: "createdAt", label: "Created At", category: "Meta" },
	{ key: "updatedAt", label: "Updated At", category: "Meta" },
];
