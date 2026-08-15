import { FileType } from "@/types/core";

/**
 * Pure type module for the business profile.
 *
 * These live here rather than in Buisness.ts so that
 * profile-update-request.types.ts can reference them without importing the API
 * module, which would create a runtime import cycle (Buisness.ts imports
 * profileUpdateRequestKeys as a value). Keep this file free of runtime imports.
 */

export interface SocialType {
	_id?: string;
	name: string;
	link: string;
}

export interface FounderStoryType {
	content?: string;
	coverImage?: FileType;
}

export interface TeamMemberType {
	name: string;
	title: string;
	avatar?: FileType;
}

export interface BusinessProfileFormType {
	businessName: string;
	dateOfRegistration: string;
	industry: string;
	bphoneNumber: string;
	email: string;
	website: string;
	legalFormat: string;
	staffSize: string;
	revenueRange: string;
	address: string;
	description: string;
	categories: string[];
	socialNetwork: SocialType[];
	companyProfile: FileType;
	businessLicense: FileType;
	attachment: FileType[];
	gallery: FileType[];
	avatar: FileType;
	founderStory?: FounderStoryType;
	teams?: TeamMemberType[];
	// Backward-compatibility for earlier payloads
	bussinessLicense?: FileType;
}

export interface RejectBusinessInput {
	id: string;
	reason?: string;
}

/**
 * Legacy per-profile update flag. The backend's request-update controllers write
 * "PENDING", "APPROVED" and "NOT_ALLOWED"; the SME client writes "DRAFT" at
 * profile creation (the create controller spreads req.body unfiltered); "" covers
 * documents saved before the field had a default.
 *
 * Note this is a different axis from SmeUpdateRequestStatus, which tracks a
 * staged SmeUpdateRequest document. A profile can have one, both, or neither.
 * "REQUEST_UPDATE" was previously listed here but nothing anywhere writes it.
 */
export type BusinessUpdateStatus =
	| "PENDING"
	| "APPROVED"
	| "NOT_ALLOWED"
	| "DRAFT"
	| "";

export interface BusinessProfileType extends BusinessProfileFormType {
	_id: string;
	smeId: {
		_id: string;
		firstName: string;
		lastName: string;
	};
	name: string;
	status: string;
	updateStatus: BusinessUpdateStatus;
	profileVersion?: number;
	approvedAt: string;
}
