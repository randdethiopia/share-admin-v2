import { CHART_COLORS } from "./chart-colors";

export const TRAINING_STATUS_DEFINITIONS = [
	{
		key: "completed",
		label: "Trainees who completed training",
		shortLabel: "Trainees who completed training",
		cardSubtext: "Participants who finished at least one training module",
		description:
			"The total number of unique trainees who have successfully completed at least one training course. Regardless of how many courses a trainee has completed, they are counted only once in this category.",
		color: CHART_COLORS.success,
	},
	{
		key: "inProgress",
		label: "Trainees in progress",
		shortLabel: "Trainees in progress",
		cardSubtext: "Participants actively working through the training",
		description:
			"The total number of unique trainees who have started at least one training course but have not yet completed any course. Trainees who already appear in Completed training are excluded to prevent duplication.",
		color: CHART_COLORS.warning,
	},
	{
		key: "accessedNotStarted",
		label: "Trainees not yet logged in",
		shortLabel: "Trainees not yet logged in",
		cardSubtext: "Access to platform provided but yet to begin training",
		description:
			"The total number of unique trainees who have been granted access to the learning platform and have completed onboarding and engagement, but have never signed in or started any training course. These trainees have been enrolled and guided by the team but have not yet engaged with the platform.",
		color: CHART_COLORS.danger,
	},
] as const;

export type TrainingStatusKey = (typeof TRAINING_STATUS_DEFINITIONS)[number]["key"];
