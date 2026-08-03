import type { BulkTraineeImportResType } from "@/lib/api/trainee";

const STORAGE_KEY = "trainee-last-import-result";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; 

export const IMPORT_RESULT_UPDATED_EVENT = "trainee-import-result-updated";

interface StoredImportResult {
	savedAt: number;
	data: BulkTraineeImportResType["data"];
}

export function saveLastImportResult(data: BulkTraineeImportResType["data"]) {
	if (typeof window === "undefined") return;
	try {
		const payload: StoredImportResult = { savedAt: Date.now(), data };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {
		// storage unavailable (quota/private mode) — results page falls back to its empty state
	}
	window.dispatchEvent(new CustomEvent(IMPORT_RESULT_UPDATED_EVENT, { detail: data }));
}

export function readLastImportResult(): BulkTraineeImportResType["data"] | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw) as StoredImportResult;
		const isValidShape =
			parsed?.data &&
			Array.isArray(parsed.data.successTrainees) &&
			Array.isArray(parsed.data.failedTrainees);
		const isExpired = !parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS;

		if (!isValidShape || isExpired) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}

		return parsed.data;
	} catch {
		return null;
	}
}
