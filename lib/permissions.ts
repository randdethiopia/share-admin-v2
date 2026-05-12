/** Coordinator-facing training workflows (roster, sessions, enrollments). Maps to backend trainee.* permissions. */
export const TRAINING_MANAGE_PERMISSIONS = [
	"trainee.read",
	"trainee.write",
	"trainee.delete",
] as const satisfies readonly string[];

/** Legacy: roles may still use coordinator:* or training:*; these normalize to trainee.* */
export const LEGACY_COORDINATOR_TRAINING_PERMISSIONS = [
	"coordinator:read",
	"coordinator:write",
	"coordinator:delete",
	"training:read",
	"training:write",
	"training:delete",
] as const satisfies readonly string[];

/** Sidebar + route gate: any of these grants the Training manage menu. */
export const TRAINING_MENU_PERMISSIONS: string[] = [
	...TRAINING_MANAGE_PERMISSIONS,
	...LEGACY_COORDINATOR_TRAINING_PERMISSIONS,
];
