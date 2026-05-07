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
	/** Populated user ref or id when API returns it */
	markedBy?: SessionEnrollmentTraineeRef | string | Record<string, unknown>;
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

/** PATCH body — align enum strings with backend. */
export type EnrollmentAttendanceStatus =
	| "attended"
	| "absent"
	| "excused"
	| "pending";

export const ENROLLMENT_ATTENDANCE_STATUSES: readonly EnrollmentAttendanceStatus[] =
	["attended", "absent", "excused", "pending"] as const;

export interface MarkAttendanceBody {
	attendanceStatus: EnrollmentAttendanceStatus;
	/** Omit or send trimmed string; backend may accept empty to clear */
	note?: string;
}

export interface MarkAttendanceRes {
	success?: boolean;
	message?: string;
	data?: {
		attendanceStatus?: string;
		note?: string;
		attendedAt?: string;
		markedBy?: unknown;
	};
}

export interface MarkAttendanceVariables {
	trainingSessionId: string;
	traineeId: string;
	body: MarkAttendanceBody;
}

/** GET /api/training-session/:id — if 404, UI skips cancelled-session guard. */
export interface TrainingSessionByIdRes {
	success?: boolean;
	data?: TrainingSessionRow;
}

export function trainingSessionRowFromDetailApi(
	res: TrainingSessionByIdRes | TrainingSessionRow | null | undefined
): TrainingSessionRow | undefined {
	if (!res || typeof res !== "object") return undefined;
	if (
		"data" in res &&
		res.data &&
		typeof res.data === "object" &&
		"_id" in res.data
	) {
		return res.data as TrainingSessionRow;
	}
	if ("_id" in res && "scheduledAt" in res) {
		return res as TrainingSessionRow;
	}
	return undefined;
}

export async function getTrainingSessionByIdFn(sessionId: string, signal?: AbortSignal) {
	const path = encodeURIComponent(sessionId);
	const res = await axios.get(`${API_URL}/api/training-session/${path}`, { signal });
	return res.data as TrainingSessionByIdRes;
}

export async function markAttendanceFn(
	trainingSessionId: string,
	traineeId: string,
	body: MarkAttendanceBody,
	signal?: AbortSignal
) {
	const sid = encodeURIComponent(trainingSessionId);
	const tid = encodeURIComponent(traineeId);
	const payload: MarkAttendanceBody = {
		attendanceStatus: body.attendanceStatus,
		...(body.note !== undefined ? { note: body.note } : {}),
	};
	const res = await axios.patch(
		`${API_URL}/api/training-session/${sid}/enrollments/${tid}/attendance`,
		payload,
		{ signal }
	);
	return res.data as MarkAttendanceRes;
}

/** --- Live attendance report + Excel export --- */

export interface AttendanceReportSummary {
	attended?: number;
	absent?: number;
	total?: number;
	[key: string]: unknown;
}

export interface AttendanceReportRow {
	_id?: string;
	traineeId?: SessionEnrollmentTraineeRef | string;
	attendanceStatus?: string;
	attendedAt?: string;
	note?: string;
	name?: string;
	email?: string;
	phone?: string;
	phoneNumber?: string;
}

export interface AttendanceReportListRes {
	success: boolean;
	data: AttendanceReportRow[];
	meta: SessionEnrollmentsListMeta;
	summary?: AttendanceReportSummary;
	session?: Partial<TrainingSessionRow>;
}

export interface AttendanceReportQueryParams {
	page: number;
	limit: number;
}

export const trainingSessionAttendanceReportQueryKey = (
	sessionId: string,
	params: AttendanceReportQueryParams
) =>
	[
		"TrainingSession",
		sessionId,
		"attendance-report",
		params.page,
		params.limit,
	] as const;

export type TrainingSessionAttendanceReportQueryKey = ReturnType<
	typeof trainingSessionAttendanceReportQueryKey
>;

export function attendanceReportParamsFromQueryKey(
	key: TrainingSessionAttendanceReportQueryKey
): { sessionId: string; params: AttendanceReportQueryParams } {
	const [, sessionId, , page, limit] = key;
	return { sessionId, params: { page, limit } };
}

function normalizeAttendanceReportRes(raw: unknown): AttendanceReportListRes {
	const r =
		raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
	const nested =
		r.data && typeof r.data === "object" && !Array.isArray(r.data)
			? (r.data as Record<string, unknown>)
			: null;

	let rows: AttendanceReportRow[] = [];
	if (Array.isArray(r.data)) rows = r.data as AttendanceReportRow[];
	else if (nested) {
		if (Array.isArray(nested.rows)) rows = nested.rows as AttendanceReportRow[];
		else if (Array.isArray(nested.data))
			rows = nested.data as AttendanceReportRow[];
	}

	const metaRaw = (r.meta ?? nested?.meta) as Record<string, unknown> | undefined;
	const meta: SessionEnrollmentsListMeta = {
		totalItems: Number(metaRaw?.totalItems ?? rows.length) || 0,
		totalPages: Number(metaRaw?.totalPages ?? 1) || 1,
		currentPage: Number(metaRaw?.currentPage ?? 1) || 1,
		pageSize: Number(metaRaw?.pageSize ?? (rows.length || 10)) || 10,
	};

	const summaryRaw = (r.summary ?? nested?.summary) as
		| Record<string, unknown>
		| undefined;
	const summary: AttendanceReportSummary | undefined = summaryRaw
		? { ...summaryRaw }
		: undefined;

	const sessionBlock =
		r.session && typeof r.session === "object"
			? (r.session as Partial<TrainingSessionRow>)
			: nested?.session && typeof nested.session === "object"
				? (nested.session as Partial<TrainingSessionRow>)
				: undefined;

	return {
		success: r.success !== false,
		data: rows,
		meta,
		...(summary ? { summary } : {}),
		...(sessionBlock ? { session: sessionBlock } : {}),
	};
}

export async function getAttendanceReportFn(
	sessionId: string,
	params: AttendanceReportQueryParams,
	signal?: AbortSignal
) {
	const path = encodeURIComponent(sessionId);
	const sp = new URLSearchParams({
		page: String(params.page),
		limit: String(params.limit),
	});
	const res = await axios.get(
		`${API_URL}/api/training-session/${path}/attendance-report?${sp.toString()}`,
		{ signal }
	);
	return normalizeAttendanceReportRes(res.data);
}

export function parseContentDispositionFilename(
	header: string | undefined
): string | null {
	if (!header || typeof header !== "string") return null;
	const star = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
	if (star?.[1]) {
		try {
			return decodeURIComponent(star[1].replace(/["']/g, "").trim());
		} catch {
			return star[1].replace(/["']/g, "").trim();
		}
	}
	const quoted = /filename="([^"]+)"/i.exec(header);
	if (quoted?.[1]) return quoted[1];
	const plain = /filename=([^;\n]+)/i.exec(header);
	if (plain?.[1]) return plain[1].replace(/["']/g, "").trim();
	return null;
}

export interface ExportAttendanceReportResult {
	blob: Blob;
	filename: string;
	snapshotId: string | null;
}

export async function exportAttendanceReportWithSnapshotFn(
	sessionId: string,
	body?: { note?: string }
): Promise<ExportAttendanceReportResult> {
	const path = encodeURIComponent(sessionId);
	const defaultFilename = `attendance-${sessionId}.xlsx`;
	const payload =
		body && typeof body.note === "string" && body.note.trim() !== ""
			? { note: body.note.trim() }
			: {};

	const res = await axios.post(
		`${API_URL}/api/training-session/${path}/attendance-report/export-with-snapshot`,
		payload,
		{ responseType: "blob", validateStatus: () => true }
	);

	if (res.status >= 400) {
		let message = `Export failed (${res.status})`;
		const data = res.data;
		if (data instanceof Blob) {
			const text = await data.text();
			try {
				const j = JSON.parse(text) as ErrorRes;
				if (typeof j.message === "string" && j.message.trim())
					message = j.message;
			} catch {
				if (text.trim()) message = text.slice(0, 280);
			}
		}
		const err = new AxiosError(
			message,
			String(res.status),
			res.config,
			res.request,
			res
		);
		throw err;
	}

	const ct = (res.headers["content-type"] ?? "").toLowerCase();
	if (ct.includes("application/json")) {
		const text = await (res.data as Blob).text();
		let message = "Server returned JSON instead of a file.";
		try {
			const j = JSON.parse(text) as ErrorRes;
			if (typeof j.message === "string" && j.message.trim()) message = j.message;
		} catch {
			/* ignore */
		}
		throw new AxiosError(message, undefined, res.config, res.request, res);
	}

	const filename =
		parseContentDispositionFilename(res.headers["content-disposition"]) ??
		defaultFilename;
	const rawId = res.headers["x-snapshot-id"];
	const snapshotId =
		typeof rawId === "string" && rawId.trim() ? rawId.trim() : null;

	return {
		blob: res.data as Blob,
		filename,
		snapshotId,
	};
}

export interface AttendanceReportSnapshotRow {
	_id: string;
	createdAt?: string;
	note?: string;
	summary?: AttendanceReportSummary;
}

export interface AttendanceReportSnapshotsListRes {
	success: boolean;
	data: AttendanceReportSnapshotRow[];
	meta: SessionEnrollmentsListMeta;
}

export const trainingSessionAttendanceSnapshotsQueryKey = (
	sessionId: string,
	params: AttendanceReportQueryParams
) =>
	[
		"TrainingSession",
		sessionId,
		"attendance-report-snapshots",
		params.page,
		params.limit,
	] as const;

export type TrainingSessionAttendanceSnapshotsQueryKey = ReturnType<
	typeof trainingSessionAttendanceSnapshotsQueryKey
>;

function normalizeAttendanceSnapshotsRes(
	raw: unknown
): AttendanceReportSnapshotsListRes {
	const r =
		raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
	const nested =
		r.data && typeof r.data === "object" && !Array.isArray(r.data)
			? (r.data as Record<string, unknown>)
			: null;

	let rows: AttendanceReportSnapshotRow[] = [];
	if (Array.isArray(r.data)) rows = r.data as AttendanceReportSnapshotRow[];
	else if (nested && Array.isArray(nested.snapshots))
		rows = nested.snapshots as AttendanceReportSnapshotRow[];
	else if (nested && Array.isArray(nested.data))
		rows = nested.data as AttendanceReportSnapshotRow[];

	const metaRaw = (r.meta ?? nested?.meta) as Record<string, unknown> | undefined;
	const meta: SessionEnrollmentsListMeta = {
		totalItems: Number(metaRaw?.totalItems ?? rows.length) || 0,
		totalPages: Number(metaRaw?.totalPages ?? 1) || 1,
		currentPage: Number(metaRaw?.currentPage ?? 1) || 1,
		pageSize: Number(metaRaw?.pageSize ?? (rows.length || 10)) || 10,
	};

	return {
		success: r.success !== false,
		data: rows,
		meta,
	};
}

export async function getAttendanceReportSnapshotsFn(
	sessionId: string,
	params: AttendanceReportQueryParams,
	signal?: AbortSignal
) {
	const path = encodeURIComponent(sessionId);
	const sp = new URLSearchParams({
		page: String(params.page),
		limit: String(params.limit),
	});
	const res = await axios.get(
		`${API_URL}/api/training-session/${path}/attendance-report/snapshots?${sp.toString()}`,
		{ signal }
	);
	return normalizeAttendanceSnapshotsRes(res.data);
}

export interface ExportAttendanceReportVariables {
	sessionId: string;
	note?: string;
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
	GetById: {
		useQuery: (
			sessionId: string,
			options?: Omit<
				UseQueryOptions<TrainingSessionByIdRes, AxiosError<ErrorRes>>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: ["TrainingSession", sessionId, "detail"] as const,
				queryFn: ({ signal }) => getTrainingSessionByIdFn(sessionId, signal),
				enabled:
					Boolean(sessionId && String(sessionId).trim()) &&
					(options?.enabled ?? true),
				retry: (failureCount, error) => {
					if (isAxiosError(error) && error.response?.status === 404) return false;
					return failureCount < 1;
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
				// Defaults; callers may override via `...options` (e.g. staleTime, placeholderData).
				staleTime: 0,
				refetchOnMount: "always",
				refetchOnWindowFocus: true,
				...options,
				enabled:
					Boolean(sessionId && String(sessionId).trim()) &&
					(options?.enabled ?? true),
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
	MarkAttendance: {
		useMutation: (
			options?: UseMutationOptions<
				MarkAttendanceRes,
				AxiosError<ErrorRes>,
				MarkAttendanceVariables
			>
		) => {
			const queryClient = useQueryClient();
			return useMutation({
				...options,
				mutationFn: ({ trainingSessionId, traineeId, body }) =>
					markAttendanceFn(trainingSessionId, traineeId, body),
				onSuccess: (data, variables, context) => {
					queryClient.invalidateQueries({
						queryKey: ["TrainingSession", variables.trainingSessionId],
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
	GetAttendanceReport: {
		useQuery: (
			sessionId: string,
			params: AttendanceReportQueryParams,
			options?: Omit<
				UseQueryOptions<
					AttendanceReportListRes,
					AxiosError<ErrorRes>
				>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: trainingSessionAttendanceReportQueryKey(sessionId, params),
				queryFn: (ctx) => {
					const key = ctx.queryKey as TrainingSessionAttendanceReportQueryKey;
					const { sessionId: sid, params: p } =
						attendanceReportParamsFromQueryKey(key);
					return getAttendanceReportFn(sid, p, ctx.signal);
				},
				...options,
				enabled:
					Boolean(sessionId && String(sessionId).trim()) &&
					(options?.enabled ?? true),
				retry: (failureCount, err) => {
					if (isAxiosError(err) && err.response?.status === 404)
						return false;
					return failureCount < 1;
				},
			}),
	},
	GetAttendanceReportSnapshots: {
		useQuery: (
			sessionId: string,
			params: AttendanceReportQueryParams,
			options?: Omit<
				UseQueryOptions<
					AttendanceReportSnapshotsListRes,
					AxiosError<ErrorRes>
				>,
				"queryKey" | "queryFn"
			>
		) =>
			useQuery({
				queryKey: trainingSessionAttendanceSnapshotsQueryKey(
					sessionId,
					params
				),
				queryFn: (ctx) => {
					const key =
						ctx.queryKey as TrainingSessionAttendanceSnapshotsQueryKey;
					const [, sid, , page, limit] = key;
					return getAttendanceReportSnapshotsFn(
						sid,
						{ page, limit },
						ctx.signal
					);
				},
				...options,
				enabled:
					Boolean(sessionId && String(sessionId).trim()) &&
					(options?.enabled ?? true),
				retry: (failureCount, err) => {
					if (isAxiosError(err) && err.response?.status === 404)
						return false;
					return failureCount < 1;
				},
			}),
	},
	ExportAttendanceReport: {
		useMutation: (
			options?: UseMutationOptions<
				ExportAttendanceReportResult,
				AxiosError<ErrorRes>,
				ExportAttendanceReportVariables
			>
		) => {
			const queryClient = useQueryClient();
			return useMutation({
				...options,
				mutationFn: ({ sessionId, note }) =>
					exportAttendanceReportWithSnapshotFn(
						sessionId,
						note !== undefined && note.trim() !== ""
							? { note: note.trim() }
							: {}
					),
				onSuccess: (data, variables, context) => {
					queryClient.invalidateQueries({
						queryKey: [
							"TrainingSession",
							variables.sessionId,
							"attendance-report-snapshots",
						],
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
		const em = error.message;
		if (typeof em === "string" && em.trim()) return em;
	}
	if (error instanceof Error && error.message.trim()) return error.message;
	return fallback;
}

export default TrainingSessionApi;
