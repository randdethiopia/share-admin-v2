import { ErrorRes } from "@/types/core";
import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios, { AxiosError, isAxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_BASE_URL;

export type TrainingSessionStatus =
	| "draft"
	| "scheduled"
	| "completed"
	| "cancelled";

/** POST /api/training-session — Auth: Bearer + `role` header via `lib/axios.ts` interceptors. */
export interface CreateTrainingSessionBody {
	title: string;
	scheduledAt: string;
	description?: string;
	location?: string;
	status?: TrainingSessionStatus;
}

export interface CreateTrainingSessionRes {
	success: boolean;
	data: unknown;
}

/** GET /api/training-session query params */
export interface TrainingSessionsListParams {
	page: number;
	limit: number;
	coordinatorId?: string;
	status?: TrainingSessionStatus;
	search?: string;
}

export interface TrainingSessionRow {
	_id: string;
	title: string;
	description?: string;
	scheduledAt: string;
	coordinatorId?: string;
	location?: string;
	status: TrainingSessionStatus | string;
	createdAt?: string;
	updatedAt?: string;
}

export interface TrainingSessionsListMeta {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
}

export interface TrainingSessionsListRes {
	success: boolean;
	data: TrainingSessionRow[];
	meta: TrainingSessionsListMeta;
}

/** Stable TanStack Query key: tuple avoids object hashing / stale-closure mismatches with the fetcher. */
export const trainingSessionListQueryKey = (filters: TrainingSessionsListParams) =>
	[
		"TrainingSession",
		"list",
		filters.page,
		filters.limit,
		filters.coordinatorId ?? "",
		filters.status ?? "",
		filters.search ?? "",
	] as const;

export type TrainingSessionListQueryKey = ReturnType<
	typeof trainingSessionListQueryKey
>;

export function trainingSessionsListParamsFromQueryKey(
	key: TrainingSessionListQueryKey
): TrainingSessionsListParams {
	const [, , page, limit, coordinatorId, status, search] = key;
	const p: TrainingSessionsListParams = { page, limit };
	if (coordinatorId) p.coordinatorId = coordinatorId;
	if (status) p.status = status as TrainingSessionStatus;
	if (search) p.search = search;
	return p;
}

export async function listTrainingSessionsFn(
	params: TrainingSessionsListParams
) {
	const sp = new URLSearchParams({
		page: String(params.page),
		limit: String(params.limit),
	});
	if (params.coordinatorId) sp.set("coordinatorId", params.coordinatorId);
	if (params.status) sp.set("status", params.status);
	const q = params.search?.trim();
	if (q) sp.set("search", q);

	const res = await axios.get(
		`${API_URL}/api/training-session?${sp.toString()}`
	);
	return res.data as TrainingSessionsListRes;
}

function trainingSessionListQueryKeyEqualScope(
	a: TrainingSessionListQueryKey,
	b: TrainingSessionListQueryKey
) {
	return (
		a[3] === b[3] &&
		a[4] === b[4] &&
		a[5] === b[5] &&
		a[6] === b[6]
	);
}

export async function createTrainingSessionFn(body: CreateTrainingSessionBody) {
	const res = await axios.post(`${API_URL}/api/training-session`, body);
	return res.data as CreateTrainingSessionRes;
}

export interface EnrollTraineesPayload {
	trainingSessionId: string;
	traineeIds: string[];
}

/** POST response body — server may nest counts under `data` or expose them at top level. */
export interface EnrollTraineesRes {
	success?: boolean;
	message?: string;
	data?: {
		enrolledCount?: number;
		alreadyEnrolledCount?: number;
		missingTraineeIds?: string[];
	};
	enrolledCount?: number;
	alreadyEnrolledCount?: number;
	missingTraineeIds?: string[];
}

export function enrollTraineesSummaryFromResponse(res: unknown): {
	enrolledCount: number;
	alreadyEnrolledCount: number;
	missingTraineeIds: string[];
} {
	const r = res as Record<string, unknown> | null | undefined;
	const nested =
		r &&
		typeof r === "object" &&
		"data" in r &&
		r.data &&
		typeof r.data === "object"
			? (r.data as Record<string, unknown>)
			: r && typeof r === "object"
				? r
				: {};
	const enrolledCount = Number(nested.enrolledCount ?? 0) || 0;
	const alreadyEnrolledCount = Number(nested.alreadyEnrolledCount ?? 0) || 0;
	const rawMissing = nested.missingTraineeIds;
	const missingTraineeIds = Array.isArray(rawMissing)
		? rawMissing.filter((x): x is string => typeof x === "string")
		: [];
	return { enrolledCount, alreadyEnrolledCount, missingTraineeIds };
}

export async function enrollTraineesFn(
	trainingSessionId: string,
	traineeIds: string[]
) {
	const path = encodeURIComponent(trainingSessionId);
	const res = await axios.post(
		`${API_URL}/api/training-session/${path}/enrollments`,
		{ traineeIds }
	);
	return res.data as EnrollTraineesRes;
}

/** GET /api/training-session/:id/enrollments */
export type SessionEnrollmentAttendanceFilter = "attended" | "absent";

export interface SessionEnrollmentsQueryParams {
	page: number;
	limit: number;
	attendanceStatus?: SessionEnrollmentAttendanceFilter | string;
	search?: string;
}

export interface SessionEnrollmentTraineeRef {
	_id?: string;
	firstname?: string;
	lastname?: string;
	email?: string;
	phoneNumber?: string;
}

export interface SessionEnrollmentRow {
	_id: string;
	traineeId: SessionEnrollmentTraineeRef | string;
	attendanceStatus?: string;
	note?: string;
	createdAt?: string;
	attendedAt?: string;
}

export interface SessionEnrollmentsListMeta {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
}

export interface SessionEnrollmentsListRes {
	success: boolean;
	data: SessionEnrollmentRow[];
	meta: SessionEnrollmentsListMeta;
}

export const trainingSessionEnrollmentsQueryKey = (
	sessionId: string,
	filters: SessionEnrollmentsQueryParams
) =>
	[
		"TrainingSession",
		sessionId,
		"enrollments",
		filters.page,
		filters.limit,
		filters.attendanceStatus ?? "",
		filters.search ?? "",
	] as const;

export type TrainingSessionEnrollmentsQueryKey = ReturnType<
	typeof trainingSessionEnrollmentsQueryKey
>;

export function sessionEnrollmentsParamsFromQueryKey(
	key: TrainingSessionEnrollmentsQueryKey
): { sessionId: string; params: SessionEnrollmentsQueryParams } {
	const [, sessionId, , page, limit, attendanceStatus, search] = key;
	const params: SessionEnrollmentsQueryParams = {
		page,
		limit,
	};
	if (attendanceStatus)
		params.attendanceStatus = attendanceStatus as SessionEnrollmentAttendanceFilter;
	if (search) params.search = search;
	return { sessionId, params };
}

export async function getSessionEnrollmentsFn(
	sessionId: string,
	params: SessionEnrollmentsQueryParams,
	signal?: AbortSignal
) {
	const path = encodeURIComponent(sessionId);
	const sp = new URLSearchParams({
		page: String(params.page),
		limit: String(params.limit),
	});
	const status = params.attendanceStatus?.toString().trim();
	if (status) sp.set("attendanceStatus", status);
	const q = params.search?.trim();
	if (q) sp.set("search", q);

	const res = await axios.get(
		`${API_URL}/api/training-session/${path}/enrollments?${sp.toString()}`,
		{
			signal,
			headers: {
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
		}
	);
	return res.data as SessionEnrollmentsListRes;
}

function trainingSessionEnrollmentsQueryKeyEqualScope(
	a: TrainingSessionEnrollmentsQueryKey,
	b: TrainingSessionEnrollmentsQueryKey
) {
	return (
		a[1] === b[1] &&
		a[4] === b[4] &&
		a[5] === b[5] &&
		a[6] === b[6]
	);
}

const TrainingSessionApi = {
	GetList: {
		useQuery: (
			filters: TrainingSessionsListParams,
			options?: Omit<
				UseQueryOptions<
					TrainingSessionsListRes,
					AxiosError<ErrorRes>
				>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: trainingSessionListQueryKey(filters),
				queryFn: (ctx) =>
					listTrainingSessionsFn(
						trainingSessionsListParamsFromQueryKey(
							ctx.queryKey as TrainingSessionListQueryKey
						)
					),
				placeholderData: (previousData, previousQuery) => {
					if (!previousData || !previousQuery?.queryKey) return undefined;
					const prev = previousQuery.queryKey as TrainingSessionListQueryKey;
					const next = trainingSessionListQueryKey(filters);
					if (
						prev[0] !== "TrainingSession" ||
						prev[1] !== "list" ||
						!trainingSessionListQueryKeyEqualScope(prev, next) ||
						prev[2] === next[2]
					) {
						return undefined;
					}
					return previousData;
				},
				...options,
			}),
	},
	GetEnrollments: {
		useQuery: (
			sessionId: string,
			filters: SessionEnrollmentsQueryParams,
			options?: Omit<
				UseQueryOptions<
					SessionEnrollmentsListRes,
					AxiosError<ErrorRes>
				>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: trainingSessionEnrollmentsQueryKey(sessionId, filters),
				queryFn: (ctx) => {
					const key = ctx.queryKey as TrainingSessionEnrollmentsQueryKey;
					const { sessionId: sid, params } =
						sessionEnrollmentsParamsFromQueryKey(key);
					return getSessionEnrollmentsFn(sid, params, ctx.signal);
				},
				placeholderData: (previousData, previousQuery) => {
					if (!previousData || !previousQuery?.queryKey) return undefined;
					const prev = previousQuery.queryKey as TrainingSessionEnrollmentsQueryKey;
					const next = trainingSessionEnrollmentsQueryKey(sessionId, filters);
					if (
						prev[0] !== "TrainingSession" ||
						prev[2] !== "enrollments" ||
						!trainingSessionEnrollmentsQueryKeyEqualScope(prev, next) ||
						prev[3] === next[3]
					) {
						return undefined;
					}
					return previousData;
				},
				...options,
				enabled:
					Boolean(sessionId && String(sessionId).trim()) &&
					(options?.enabled ?? true),
				// Enrollments + search must hit the network — override global staleTime / focus defaults.
				staleTime: 0,
				refetchOnMount: "always",
				refetchOnWindowFocus: true,
			}),
	},
	Create: {
		useMutation: (
			options?: UseMutationOptions<
				CreateTrainingSessionRes,
				AxiosError<ErrorRes>,
				CreateTrainingSessionBody
			>
		) => {
			const queryClient = useQueryClient();
			return useMutation({
				...options,
				mutationFn: createTrainingSessionFn,
				onSuccess: (data, variables, context) => {
					queryClient.invalidateQueries({ queryKey: ["TrainingSession"] });
					queryClient.invalidateQueries({
						queryKey: ["Coordinator", "sessions"],
					});
					options?.onSuccess?.(
						data,
						variables,
						context,
						undefined as unknown as never
					);
				},
			});
		},
	},
	EnrollTrainees: {
		useMutation: (
			options?: UseMutationOptions<
				EnrollTraineesRes,
				AxiosError<ErrorRes>,
				EnrollTraineesPayload
			>
		) => {
			const queryClient = useQueryClient();
			return useMutation({
				...options,
				mutationFn: ({ trainingSessionId, traineeIds }) =>
					enrollTraineesFn(trainingSessionId, traineeIds),
				onSuccess: (data, variables, context) => {
					queryClient.invalidateQueries({
						queryKey: ["TrainingSession", variables.trainingSessionId],
					});
					queryClient.invalidateQueries({
						queryKey: ["TrainingSession", "list"],
					});
					options?.onSuccess?.(
						data,
						variables,
						context,
						undefined as unknown as never
					);
				},
			});
		},
	},
};

export function trainingSessionErrorMessage(error: unknown, fallback: string) {
	if (isAxiosError(error)) {
		const msg = error.response?.data?.message;
		if (typeof msg === "string" && msg.trim()) return msg;
	}
	return fallback;
}

export default TrainingSessionApi;
