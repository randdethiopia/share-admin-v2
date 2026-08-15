import { ErrorRes, FileType, SuccessRes } from "@/types/core";
import {
	UseMutationOptions,
	UseQueryOptions,
	QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import type {
	ApproveStagingRequestInput,
	RejectStagingRequestInput,
	SmeUpdateRequestDetailApiResponse,
	SmeUpdateRequestDetailResponse,
} from "./profile-update-request.types";
import { profileUpdateRequestKeys } from "./profile-update-request.types";
import type {
	BusinessProfileFormType,
	BusinessProfileType,
	RejectBusinessInput,
} from "./Buisness.types";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type {
	ApproveStagingRequestInput,
	RejectStagingRequestInput,
	SmeProfileUpdateFieldKey,
	SmeProfileUpdateRequestPayload,
	SmeUpdateRequestDetailResponse,
	SmeUpdateRequestStatus,
	SmeUpdateRequestType,
} from "./profile-update-request.types";
export {
	getProposedChangeKeys,
	isReviewableUpdateRequest,
	isSmeProfileUpdateFieldKey,
	profileUpdateRequestKeys,
	SME_PROFILE_FIELD_LABELS,
} from "./profile-update-request.types";

export type {
	BusinessProfileFormType,
	BusinessProfileType,
	BusinessUpdateStatus,
	RejectBusinessInput,
	SocialType,
} from "./Buisness.types";

function getApprovedAt(res: unknown) {
	if (!res || typeof res !== "object") return undefined;
	const record = res as { approvedAt?: string | null; data?: { approvedAt?: string | null } };
	return record.data?.approvedAt ?? record.approvedAt ?? undefined;
}

function updateBusinessProfileCache(
	queryClient: QueryClient,
	id: string,
	updates: Partial<BusinessProfileType>
) {
	queryClient.setQueryData(
		["BusinessProfile"],
		(current?: BusinessProfileType[]) =>
			Array.isArray(current)
				? current.map((item) =>
						item._id === id ? { ...item, ...updates } : item
					)
				: current
	);

	queryClient.setQueryData(
		["BusinessProfile", id],
		(current?: BusinessProfileType) =>
			current ? { ...current, ...updates } : current
	);
}

// --- Worker functions ---
export async function createBusinessProfileFn(data: BusinessProfileFormType) {
	return (await axios.post(`${API_URL}/api/sme-profile/create`, data)).data;
}

export async function getMyBusinessProfileFn() {
	return (await axios.get(`${API_URL}/api/sme-profile/my-profile`)).data;
}

export async function getBusinessProfilesFn() {
	return (await axios.get(`${API_URL}/api/sme-profile/get`)).data;
}

export async function getBusinessProfileByIdFn(id: string) {
	return (await axios.get(`${API_URL}/api/sme-profile/show/${id}`)).data;
}

export async function approveBusinessProfileFn(id: string) {
	return (await axios.patch(`${API_URL}/api/sme-profile/approve/${id}`)).data;
}

export async function rejectBusinessProfileFn({ id, reason }: RejectBusinessInput) {
	return (
		await axios.patch(`${API_URL}/api/sme-profile/reject/${id}`, {
			...(reason ? { reason } : {}),
		})
	).data;
}

export async function updateApproveBusinessProfileFn(id: string) {
	return (await axios.post(`${API_URL}/api/sme-profile/approve-update/${id}`))
		.data;
}

export async function updateRejectBusinessProfileFn({
	id,
	reason,
}: RejectBusinessInput) {
	return (
		await axios.post(`${API_URL}/api/sme-profile/reject-update/${id}`, {
			...(reason ? { reason } : {}),
		})
	).data;
}

/**
 * Fetches the staged update request for a profile, if one is awaiting review.
 *
 * Resolves to null when there is nothing to review — either the profile has no
 * pending request (200 with pendingRequest: null) or the profile itself is not
 * found (404). Any other error is rethrown so the caller can surface it; a 403 or
 * 500 must not be silently indistinguishable from "nothing pending".
 *
 * The `/profile/` path segment is required — the backend mounts this handler at
 * `/profile/:profileId`, and the collection route lives at the router root.
 */
export async function getPendingUpdateRequestFn(
	profileId: string
): Promise<SmeUpdateRequestDetailResponse | null> {
	try {
		const res = await axios.get<SmeUpdateRequestDetailApiResponse>(
			`${API_URL}/api/admin/profile-update-requests/profile/${profileId}`
		);

		const { data } = res.data;
		if (!data?.pendingRequest) {
			return null;
		}

		return {
			success: res.data.success,
			request: data.pendingRequest,
			liveProfile: data.profile,
		};
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 404) {
			return null;
		}
		throw error;
	}
}

export async function approveStagingRequestFn(requestId: string) {
	return (
		await axios.post<SuccessRes>(
			`${API_URL}/api/admin/profile-update-requests/${requestId}/approve`
		)
	).data;
}

export async function rejectStagingRequestFn({
	requestId,
	rejectionReason,
}: Omit<RejectStagingRequestInput, "profileId">) {
	return (
		await axios.post<SuccessRes>(
			`${API_URL}/api/admin/profile-update-requests/${requestId}/reject`,
			{ rejectionReason }
		)
	).data;
}

function invalidateProfileUpdateQueries(
	queryClient: QueryClient,
	profileId: string
) {
	queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
	queryClient.invalidateQueries({ queryKey: ["BusinessProfile", profileId] });
	queryClient.invalidateQueries({
		queryKey: profileUpdateRequestKeys.detail(profileId),
	});
}

const BusinessProfileApi = {
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				BusinessProfileFormType
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: createBusinessProfileFn,
				onSuccess: (res, variables, context) => {
					toast.success(res.message || "Created successfully");
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", "my"] });
					options?.onSuccess?.(res, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
				...options,
			});
		},
	},

	GetMyProfile: {
		useQuery: (options?: UseQueryOptions<BusinessProfileType, AxiosError<ErrorRes>>) =>
			useQuery({
				queryKey: ["BusinessProfile", "my"],
				queryFn: getMyBusinessProfileFn,
				...options,
			}),
	},

	GetList: {
		useQuery: (
			options?: UseQueryOptions<BusinessProfileType[], AxiosError<ErrorRes>>
		) =>
			useQuery({
				queryKey: ["BusinessProfile"],
				queryFn: getBusinessProfilesFn,
				...options,
			}),
	},

	GetById: {
		useQuery: (
			id: string,
			options?: UseQueryOptions<BusinessProfileType, AxiosError<ErrorRes>>
		) =>
			useQuery({
				...options,
				queryKey: ["BusinessProfile", id],
				queryFn: () => getBusinessProfileByIdFn(id),
				// Spread first: a caller passing `enabled` must not be able to clobber
				// the empty-id guard and fire a request at /BusinessProfile/undefined.
				enabled: Boolean(id) && (options?.enabled ?? true),
			}),
	},

	Approve: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: approveBusinessProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					updateBusinessProfileCache(queryClient, id, {
						status: "APPROVED",
						approvedAt: getApprovedAt(res) ?? new Date().toISOString(),
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, id, context, undefined as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as never);
				},
				...options,
			});
		},
	},

	Reject: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				RejectBusinessInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: rejectBusinessProfileFn,
				onSuccess: (res, { id }, context) => {
					toast.success(res.message || "Rejected");
					updateBusinessProfileCache(queryClient, id, {
						status: "REJECTED",
						approvedAt: getApprovedAt(res),
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, { id }, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
				...options,
			});
		},
	},

	UpdateApprove: {
		useMutation: (
			options?: UseMutationOptions<SuccessRes, AxiosError<ErrorRes>, string>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: updateApproveBusinessProfileFn,
				onSuccess: (res, id, context) => {
					toast.success(res.message || "Approved");
					updateBusinessProfileCache(queryClient, id, {
						updateStatus: "APPROVED",
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, id, context, undefined as never);
				},
				onError: (err, id, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, id, context, undefined as never);
				},
				...options,
			});
		},
	},

	UpdateReject: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				RejectBusinessInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: updateRejectBusinessProfileFn,
				onSuccess: (res, { id }, context) => {
					toast.success(res.message || "Rejected");
					// rejectProfileUpdate writes "NOT_ALLOWED", not "REJECTED" — patching
					// the latter showed a status the server never produces.
					updateBusinessProfileCache(queryClient, id, {
						updateStatus: "NOT_ALLOWED",
					});
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile"] });
					queryClient.invalidateQueries({ queryKey: ["BusinessProfile", id] });
					options?.onSuccess?.(res, { id }, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
				...options,
			});
		},
	},

	pendingUpdateRequest: {
		useQuery: (
			profileId: string,
			options?: Omit<
				UseQueryOptions<
					SmeUpdateRequestDetailResponse | null,
					AxiosError<ErrorRes>
				>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				retry: false,
				...options,
				queryKey: profileUpdateRequestKeys.detail(profileId),
				queryFn: () => getPendingUpdateRequestFn(profileId),
				// Spread first so a caller's `enabled` cannot defeat the empty-id guard.
				enabled: Boolean(profileId) && (options?.enabled ?? true),
			}),
	},

	approveStagingRequest: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				ApproveStagingRequestInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: ({ requestId }: ApproveStagingRequestInput) =>
					approveStagingRequestFn(requestId),
				onSuccess: (res, variables, context) => {
					toast.success("Profile updates approved and published.");
					// No optimistic updateStatus patch: the staging system never writes
					// updateStatus (it is on the backend's protected-field list), so
					// guessing a value here would show the admin a state the server
					// never had. Invalidation alone is correct — the refetched request
					// comes back null and the banner clears.
					invalidateProfileUpdateQueries(queryClient, variables.profileId);
					options?.onSuccess?.(res, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					if (err.response?.status === 409) {
						toast.error("Version conflict detected. Profile data refreshed.");
						queryClient.invalidateQueries({
							queryKey: profileUpdateRequestKeys.detail(variables.profileId),
						});
						queryClient.invalidateQueries({
							queryKey: ["BusinessProfile", variables.profileId],
						});
					} else {
						toast.error(err.response?.data?.message || "Error");
					}
					options?.onError?.(err, variables, context, undefined as never);
				},
				...options,
			});
		},
	},

	rejectStagingRequest: {
		useMutation: (
			options?: UseMutationOptions<
				SuccessRes,
				AxiosError<ErrorRes>,
				RejectStagingRequestInput
			>
		) => {
			const queryClient = useQueryClient();

			return useMutation({
				mutationFn: rejectStagingRequestFn,
				onSuccess: (res, variables, context) => {
					toast.success("Update request rejected.");
					// See approveStagingRequest: updateStatus is not ours to patch.
					invalidateProfileUpdateQueries(queryClient, variables.profileId);
					options?.onSuccess?.(res, variables, context, undefined as never);
				},
				onError: (err, variables, context) => {
					toast.error(err.response?.data?.message || "Error");
					options?.onError?.(err, variables, context, undefined as never);
				},
				...options,
			});
		},
	},
};

export default BusinessProfileApi;
