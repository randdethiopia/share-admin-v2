import type {
	BusinessProfileFormType,
	BusinessProfileType,
} from "./Buisness.types";

export type SmeUpdateRequestStatus =
	| "PENDING_REVIEW"
	| "APPROVED"
	| "REJECTED"
	| "CONFLICTED"
	| "CANCELLED";

/**
 * Display labels for every field that can appear in a staged update request.
 *
 * This object is the single source of truth: the SmeProfileUpdateFieldKey union
 * and the runtime lookup set are both derived from its keys, so the three cannot
 * drift apart.
 *
 * The 20 keys below mirror the backend allowlist (SME_UPDATE_ALLOWLIST_FIELDS)
 * and the SME client's payload builder exactly.
 */
export const SME_PROFILE_FIELD_LABELS = {
	businessName: "Business Name",
	legalFormat: "Legal Structure",
	email: "Email",
	bphoneNumber: "Phone Number",
	industry: "Industry",
	staffSize: "Staff Size",
	website: "Website",
	address: "Address",
	categories: "Categories",
	socialNetwork: "Social Networks",
	revenueRange: "Revenue Range",
	dateOfRegistration: "Registration Date",
	description: "Description",
	avatar: "Avatar",
	gallery: "Gallery",
	companyProfile: "Company Profile",
	businessLicense: "Business License",
	attachment: "Additional Attachments",
	founderStory: "Founder Story",
	teams: "Team Members",
} as const satisfies Partial<Record<keyof BusinessProfileFormType, string>>;

export type SmeProfileUpdateFieldKey = keyof typeof SME_PROFILE_FIELD_LABELS;

export type SmeProfileUpdateRequestPayload = Partial<
	Pick<BusinessProfileFormType, SmeProfileUpdateFieldKey>
>;

export interface SmeUpdateRequestType {
	_id: string;
	smeId: string;
	profileId: string;
	baseProfileVersion: number;
	proposedChanges: SmeProfileUpdateRequestPayload;
	previousValues: SmeProfileUpdateRequestPayload;
	status: SmeUpdateRequestStatus;
	rejectionReason?: string;
	requestVersion: number;
	requestedAt: string;
	reviewedAt?: string;
	reviewedBy?: string;
}

/**
 * Raw wire shape of GET /api/admin/profile-update-requests/profile/:profileId.
 *
 * The backend wraps every payload in a `data` envelope and names the two halves
 * `profile` / `pendingRequest`. Do not consume this directly — getPendingUpdateRequestFn
 * maps it to SmeUpdateRequestDetailResponse so components see one stable shape.
 */
export interface SmeUpdateRequestDetailApiResponse {
	success: boolean;
	data: {
		profile: BusinessProfileType;
		pendingRequest: SmeUpdateRequestType | null;
	};
}

export interface ProfileUpdateQueuePagination {
	page?: number;
	limit?: number;
	total?: number;
	totalPages?: number;
}

/** Wire shape of GET /api/admin/profile-update-requests (list queue). */
export type ProfileUpdateQueueApiResponse =
	| SmeUpdateRequestType[]
	| {
			data: SmeUpdateRequestType[];
			pagination?: ProfileUpdateQueuePagination;
	  }
	| {
			success?: boolean;
			data: SmeUpdateRequestType[];
			pagination?: ProfileUpdateQueuePagination;
	  };

export function normalizeProfileUpdateQueueResponse(
	raw: ProfileUpdateQueueApiResponse
): SmeUpdateRequestType[] {
	if (Array.isArray(raw)) {
		return raw;
	}
	if (raw && typeof raw === "object" && Array.isArray(raw.data)) {
		return raw.data;
	}
	return [];
}

export function getPendingProfileIdsFromQueue(
	requests: SmeUpdateRequestType[]
): Set<string> {
	return new Set(
		requests
			.filter((req) => req.status === "PENDING_REVIEW")
			.map((req) => String(req.profileId))
	);
}

/** Client-facing shape, mapped from SmeUpdateRequestDetailApiResponse. */
export interface SmeUpdateRequestDetailResponse {
	success: boolean;
	request: SmeUpdateRequestType;
	liveProfile: BusinessProfileType;
}

export interface RejectStagingRequestInput {
	requestId: string;
	profileId: string;
	rejectionReason: string;
}

export interface ApproveStagingRequestInput {
	requestId: string;
	profileId: string;
}

export const profileUpdateRequestKeys = {
	detail: (profileId: string) => ["profileUpdateRequest", profileId] as const,
	all: ["profileUpdateRequest"] as const,
};

const SME_PROFILE_UPDATE_FIELD_SET = new Set<string>(
	Object.keys(SME_PROFILE_FIELD_LABELS)
);

export function isSmeProfileUpdateFieldKey(
	key: string
): key is SmeProfileUpdateFieldKey {
	return SME_PROFILE_UPDATE_FIELD_SET.has(key);
}

export function getProposedChangeKeys(
	proposedChanges: SmeProfileUpdateRequestPayload
): SmeProfileUpdateFieldKey[] {
	return Object.keys(proposedChanges).filter(isSmeProfileUpdateFieldKey);
}

export function isReviewableUpdateRequest(request: SmeUpdateRequestType): boolean {
	return request.status === "PENDING_REVIEW" || request.status === "CONFLICTED";
}

/**
 * A CONFLICTED request was staged against a profile version that has since moved,
 * so its "Current (Live)" column no longer reflects what the SME was editing.
 * It is still reviewable, but the admin must be told before they approve.
 */
export function isConflictedUpdateRequest(
	request: SmeUpdateRequestType
): boolean {
	return request.status === "CONFLICTED";
}
