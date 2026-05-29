import axios from "axios";
import {
	useMutation,
	UseMutationOptions,
	useQuery,
	useQueryClient,
	UseQueryOptions,
} from "@tanstack/react-query";

export interface Permission {
  _id: string;
  name: string;
  description: string;
}

export interface Role {
	_id: string;
	name: string;
	description: string;
	/** Populated permission docs when the API returns them. */
	permissions: Permission[];
	/** ObjectId strings when list endpoint does not populate `permissions`. */
	permissionIds?: string[];
}

function normId(s: string): string {
	return String(s).trim();
}

/** Pull an id from a string ref or object with _id / id / $oid (Mongo-style). */
export function permissionRefToId(ref: unknown): string | null {
	if (ref == null) return null;
	if (typeof ref === "string") {
		const t = ref.trim();
		return t.length ? t : null;
	}
	if (typeof ref !== "object") return null;
	const o = ref as Record<string, unknown>;
	for (const key of ["_id", "id"]) {
		const v = o[key];
		if (typeof v === "string" && v.trim()) return v.trim();
		if (v && typeof v === "object" && "$oid" in (v as object)) {
			const oid = (v as { $oid: unknown }).$oid;
			if (typeof oid === "string" && oid.trim()) return oid.trim();
		}
	}
	return null;
}

function idsFromUnknownArray(arr: unknown[]): string[] {
	const out: string[] = [];
	for (const item of arr) {
		const id = permissionRefToId(item);
		if (id) out.push(id);
	}
	return out;
}

function matchCatalog(ids: string[], catalog: Permission[]): Permission[] {
	if (!ids.length || !catalog.length) return [];
	const set = new Set(ids.map(normId));
	return catalog.filter((p) => {
		if (set.has(normId(p._id))) return true;
		const alt = (p as unknown as { id?: string }).id;
		return typeof alt === "string" && set.has(normId(alt));
	});
}

/**
 * Build full Permission rows for the viewer when GET /roles returns ids or partial refs only.
 */
export function resolveRolePermissions(
	role: Role,
	catalog: Permission[]
): Permission[] {
	const extTop = role as unknown as Record<string, unknown>;
	const rawPermField = extTop.permissions;
	if (typeof rawPermField === "string" && rawPermField.trim() && catalog.length) {
		const ids = rawPermField
			.split(/[,\s;]+/)
			.map((s) => s.trim())
			.filter(Boolean);
		if (ids.length) return matchCatalog(ids, catalog);
	}

	const fromPopulated = role.permissions;
	if (Array.isArray(fromPopulated) && fromPopulated.length > 0) {
		const first = fromPopulated[0] as unknown;
		if (typeof first === "string") {
			return matchCatalog(fromPopulated as unknown as string[], catalog);
		}
		const hasNames = fromPopulated.some(
			(p) =>
				p &&
				typeof (p as Permission).name === "string" &&
				String((p as Permission).name).length > 0
		);
		if (hasNames) return fromPopulated;
		const fromRefs = idsFromUnknownArray(fromPopulated as unknown[]);
		if (fromRefs.length && catalog.length) return matchCatalog(fromRefs, catalog);
	}
	const ext = role as unknown as Record<string, unknown>;
	if (Array.isArray(ext.permissionIds) && ext.permissionIds.length && catalog.length) {
		const ids = idsFromUnknownArray(ext.permissionIds as unknown[]);
		if (ids.length) return matchCatalog(ids, catalog);
	}
	const perm = ext.permission;
	if (Array.isArray(perm) && perm.length && catalog.length) {
		const ids = idsFromUnknownArray(perm as unknown[]);
		if (ids.length) return matchCatalog(ids, catalog);
	}
	if (perm != null && catalog.length) {
		const one = permissionRefToId(perm);
		if (one) return matchCatalog([one], catalog);
	}
	return [];
}

export interface RoleResponse {
  message: string;
  roles: Role[];
}

export interface PermissionResponse {
  message: string;
  permissions: Permission[];
}

interface CreateRoleInput {
  name: string;
  description: string;
  permissionIds: string[]
}

interface CreateRoleResponse {
  message: string;
  role: Role;
}

export interface UpdateRolePayload {
	roleId: string;
	name: string;
	description: string;
	/** Full replacement when sent; omit on backend for no change — UI always sends current selection. */
	permissionIds: string[];
}

interface UpdateRoleResponse {
	message: string;
	role: Role;
}

interface AssignRoleInput {
  userId: string;
  roleIds: string[];
}

interface AssignRoleResponse {
  message: string;
}

const createRoleFn = async (data: CreateRoleInput) => {
  return (await axios.post("/api/access/roles", data)).data
}

const updateRoleFn = async ({
	roleId,
	...body
}: UpdateRolePayload): Promise<UpdateRoleResponse> => {
	return (
		await axios.patch(`/api/access/roles/${encodeURIComponent(roleId)}`, body)
	).data;
};

const assignRoleFn = async (data: AssignRoleInput) => {
  return (await axios.post("/api/access/assign-role", data)).data
}

/** GET /api/access/roles/:id — full role (permissions populated) when list rows omit them. */
const getRoleByIdFn = async (id: string): Promise<Role> => {
	const data = (await axios.get(`/api/access/roles/${encodeURIComponent(id)}`)).data;
	if (data?.role && typeof data.role === "object" && data.role._id) {
		return data.role as Role;
	}
	if (data && typeof data === "object" && "_id" in data && (data as Role)._id) {
		return data as Role;
	}
	throw new Error("Unexpected role detail response");
};

/**
 * List roles. Prefer every role to include `permissions` or `permissionIds`; if not, the UI uses {@link getRoleByIdFn}.
 */
const getRolesFn = async () => {
	const data = (await axios.get("/api/access/roles")).data;
	// #region agent log
	const rolesRaw = (data?.roles ?? []) as Record<string, unknown>[];
	const summary = rolesRaw.map((r) => ({
		name: r.name,
		permLen: Array.isArray(r.permissions) ? r.permissions.length : null,
		permissionIdsLen: Array.isArray(r.permissionIds) ? r.permissionIds.length : null,
		keys: r ? Object.keys(r).sort() : [],
	}));
	const coord = rolesRaw.find((r) => r.name === "coordinator");
	let coordinatorShape: Record<string, unknown> | null = null;
	if (coord) {
		const perm0 = Array.isArray(coord.permissions) ? coord.permissions[0] : undefined;
		coordinatorShape = {
			keys: Object.keys(coord).sort(),
			permissionsKind: coord.permissions === undefined ? "undefined" : Array.isArray(coord.permissions) ? "array" : typeof coord.permissions,
			permissionsLen: Array.isArray(coord.permissions) ? coord.permissions.length : null,
			perm0Keys:
				perm0 != null && typeof perm0 === "object"
					? Object.keys(perm0 as object).sort()
					: typeof perm0,
			permissionIdsLen: Array.isArray(coord.permissionIds) ? coord.permissionIds.length : null,
		};
	}
	// #endregion
	return data;
}

function normalizePermissionsResponse(data: unknown): Permission[] {
	if (data == null) return [];
	if (Array.isArray(data)) {
		return coercePermissionRows(data);
	}
	if (typeof data !== "object") return [];
	const o = data as Record<string, unknown>;
	let raw: unknown = o.permissions;
	if (!Array.isArray(raw) && o.data != null && typeof o.data === "object") {
		const inner = o.data as Record<string, unknown>;
		raw = inner.permissions ?? inner.data;
	}
	if (!Array.isArray(raw) && Array.isArray(o.data)) {
		raw = o.data;
	}
	if (!Array.isArray(raw)) return [];
	return coercePermissionRows(raw);
}

function coercePermissionRows(raw: unknown[]): Permission[] {
	const out: Permission[] = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const p = item as Record<string, unknown>;
		const id =
			permissionRefToId(p._id) ??
			permissionRefToId(p.id) ??
			"";
		const name = typeof p.name === "string" ? p.name : "";
		if (!id.trim() || !name) continue;
		out.push({
			_id: id.trim(),
			name: name.trim(),
			description: typeof p.description === "string" ? p.description : "",
		});
	}
	return out;
}

const getPermissionsFn = async (): Promise<PermissionResponse> => {
	const data = (await axios.get("/api/access/permissions")).data;
	const permissions = normalizePermissionsResponse(data);
	const message =
		typeof data === "object" && data && "message" in data && typeof (data as { message: unknown }).message === "string"
			? (data as { message: string }).message
			: "";
	return { message, permissions };
};


const Access = {
  createRole: {
    useMutation: (options?: UseMutationOptions<CreateRoleResponse, unknown, CreateRoleInput>) =>
      useMutation({
        mutationFn: (data) => createRoleFn(data),
        ...options
      })
  },
	updateRole: {
		useMutation: (
			options?: UseMutationOptions<UpdateRoleResponse, unknown, UpdateRolePayload>
		) => {
			const queryClient = useQueryClient();
			return useMutation({
				mutationFn: updateRoleFn,
				...options,
				onSuccess: (data, variables, context) => {
					queryClient.invalidateQueries({ queryKey: ["roles"] });
					queryClient.invalidateQueries({ queryKey: ["access", "role", variables.roleId] });
					options?.onSuccess?.(data, variables, context, undefined as never);
				},
			});
		},
	},
  assignRole: {
    useMutation: (options?: UseMutationOptions<AssignRoleResponse, unknown, AssignRoleInput>) =>
      useMutation({
        mutationFn: (data) => assignRoleFn(data),
        ...options,
      })
  },
	getRole: {
		useQuery: (
			roleId: string | null,
			options?: Omit<UseQueryOptions<Role, Error>, "queryKey" | "queryFn" | "enabled">
		) =>
			useQuery({
				queryKey: ["access", "role", roleId],
				queryFn: () => getRoleByIdFn(roleId!),
				enabled: Boolean(roleId),
				staleTime: 60_000,
				...options,
			}),
	},
  getRoles: {
    useQuery: (options?: UseQueryOptions<RoleResponse, Error>) =>
      useQuery({
        queryKey: ["roles"],
        queryFn: getRolesFn,
        ...options
      })
  },

  getPermissions: {
    useQuery: (options?: UseQueryOptions<PermissionResponse, Error>) =>
      useQuery({
        queryKey: ["permissions"],
        queryFn: getPermissionsFn,
        ...options
      })
  },

}

export default Access;
