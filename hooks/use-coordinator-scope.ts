"use client";

import CoordinatorApi, { type CoordinatorType } from "@/lib/api/coordinator";
import useAuthStore from "@/store/useAuthStore";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";

export const COORDINATOR_SCOPE_STORAGE_KEY = "coordinator-scope-id";

const MONGO_OBJECT_ID = /^[a-f\d]{24}$/i;

function normalizePermissions(permissions: string[] | null | undefined): string[] {
	return (
		permissions
			?.map((p) => p.toLowerCase().trim())
			.filter((p) => p.length > 0) ?? []
	);
}

function hasTrainingManagePermissionScope(p: string[]): boolean {
	// Modern (API catalog): trainee.read / trainee.write / trainee.delete
	if (p.some((x) => x.startsWith("trainee."))) return true;
	if (p.some((x) => x.startsWith("trainee:"))) return true;

	// Alternate naming used in some backends/older roles
	if (p.some((x) => x.startsWith("training:"))) return true;
	if (p.some((x) => x.startsWith("training."))) return true;

	// Legacy coordinator:* until roles migrate
	if (p.some((x) => x.startsWith("coordinator:"))) return true;
	if (p.some((x) => x.startsWith("coordinator."))) return true;
	return false;
}

/**
 * Admin-only: show the coordinator scope picker for users who may impersonate any coordinator.
 * Users with `role === "ADMIN"` but only `training:*` (or legacy `coordinator:*`) behave like scoped admins.
 */
export function needsCoordinatorPicker(
	role: string | null | undefined,
	permissions?: string[] | null
): boolean {
	const normalizedRole = role?.trim().toUpperCase() ?? "";

	// Explicitly hide picker for coordinator-role users (they cannot impersonate others)
	if (normalizedRole === "COORDINATOR") return false;

	// Hide picker for any non-admin role
	if (normalizedRole !== "ADMIN") return false;

	// For ADMIN-role users, check permissions to determine if they're true admins
	// or admins with only training-manage / legacy coordinator scope
	const p = normalizePermissions(permissions);
	if (p.length === 0) return true;

	if (p.includes("all_access")) return true;
	if (p.some((x) => x.startsWith("admin:"))) return true;
	if (p.some((x) => x.startsWith("admin."))) return true;

	if (hasTrainingManagePermissionScope(p)) return false;

	return true;
}

export function useCoordinatorScope() {
	const role = useAuthStore((s) => s.role);
	const permissions = useAuthStore((s) => s.permissions);
	const selfId = useAuthStore((s) => s._id);
	const hasHydrated = useAuthStore((s) => s.hasHydrated);

	const isPickerMode = needsCoordinatorPicker(role, permissions);

	const [selectedCoordinatorId, setSelectedCoordinatorIdState] = useState(() => {
		if (typeof window === "undefined") return "";
		try {
			const v = localStorage.getItem(COORDINATOR_SCOPE_STORAGE_KEY);
			if (v && MONGO_OBJECT_ID.test(v)) return v;
		} catch {
			/* ignore */
		}
		return "";
	});

	const setSelectedCoordinatorId = useCallback((id: string) => {
		const next = id.trim();
		setSelectedCoordinatorIdState(next);
		try {
			if (next) {
				localStorage.setItem(COORDINATOR_SCOPE_STORAGE_KEY, next);
			} else {
				localStorage.removeItem(COORDINATOR_SCOPE_STORAGE_KEY);
			}
		} catch {
			/* ignore */
		}
	}, []);

	const {
		data: coordinatorData,
		isLoading: isCoordinatorListLoading,
		isError: isCoordinatorListError,
	} = CoordinatorApi.GetList.useQuery({
		enabled: hasHydrated && isPickerMode,
	});

	const coordinators: CoordinatorType[] = useMemo(
		() => coordinatorData?.data ?? [],
		[coordinatorData]
	);

	useEffect(() => {
		if (!isPickerMode || coordinators.length === 0 || !selectedCoordinatorId)
			return;
		const exists = coordinators.some((c) => c._id === selectedCoordinatorId);
		if (!exists) {
			startTransition(() => {
				setSelectedCoordinatorId("");
			});
		}
	}, [
		isPickerMode,
		coordinators,
		selectedCoordinatorId,
		setSelectedCoordinatorId,
	]);

	const effectiveCoordinatorId = useMemo(() => {
		// Avoid treating an admin like a non-admin during persist rehydrate / transient role=null,
		// which would use selfId (or "") while the picker still shows a coordinator id.
		if (role === null) return "";
		if (needsCoordinatorPicker(role, permissions)) return selectedCoordinatorId.trim();
		return (selfId ?? "").trim();
	}, [role, permissions, selectedCoordinatorId, selfId]);

	const hasValidSelfId = Boolean(selfId?.trim());

	const canScopeTraineeFetch =
		hasHydrated &&
		role !== null &&
		(isPickerMode ? Boolean(selectedCoordinatorId.trim()) : hasValidSelfId);

	return {
		role,
		isPickerMode,
		effectiveCoordinatorId,
		canScopeTraineeFetch,
		hasValidSelfId,
		selectedCoordinatorId,
		setSelectedCoordinatorId,
		coordinators,
		isCoordinatorListLoading,
		isCoordinatorListError,
	};
}
