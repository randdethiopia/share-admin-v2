import { CHART_COLORS } from "./chart-colors";

export const TRAINING_STATUS_DEFINITIONS = [
	{
		key: "completed",
		label: "Completed training",
		shortLabel: "Completed training",
		cardSubtext:
			"Unique trainees who completed at least one course. Each person is counted once, no matter how many courses they finished.",
		description:
			"The total number of unique trainees who have successfully completed at least one training course. Regardless of how many courses a trainee has completed, they are counted only once in this category.",
		color: CHART_COLORS.success,
	},
	{
		key: "inProgress",
		label: "Training in progress",
		shortLabel: "Training in progress",
		cardSubtext:
			"Unique trainees who started a course but have not completed any. Anyone already counted as completed is excluded.",
		description:
			"The total number of unique trainees who have started at least one training course but have not yet completed any course. Trainees who already appear in Completed training are excluded to prevent duplication.",
		color: CHART_COLORS.warning,
	},
	{
		key: "accessedNotStarted",
		label: "Platform accessed, not started",
		shortLabel: "Accessed, not started",
		cardSubtext:
			"Unique trainees onboarded onto the platform who have not yet signed in or started any course.",
		description:
			"The total number of unique trainees who have been granted access to the learning platform and have completed onboarding and engagement, but have never signed in or started any training course. These trainees have been enrolled and guided by the team but have not yet engaged with the platform.",
		color: CHART_COLORS.danger,
	},
] as const;

export type TrainingStatusKey = (typeof TRAINING_STATUS_DEFINITIONS)[number]["key"];
