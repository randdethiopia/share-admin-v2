"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Loader2, Pencil, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { Permission, Role, resolveRolePermissions } from "@/lib/api/access";

import { TRAINING_MENU_PERMISSIONS } from "@/lib/permissions";


const createRoleSchema = z.object({
	name: z.string().trim().min(1, "Role name is required"),
	description: z.string().trim().min(1, "Description is required"),
	permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

type CreateRoleInput = z.infer<typeof createRoleSchema>;

const editRoleSchema = z.object({
	name: z.string().trim().min(1, "Role name is required"),
	description: z.string().trim().min(1, "Description is required"),
	permissionIds: z.array(z.string()),
});

type EditRoleInput = z.infer<typeof editRoleSchema>;

/**
 * Collapse training_manage, Training.Manage, coordinator:read, training:read, trainee.read, etc. into a single "training" row.
 */
function trainingGridResourceKey(resourcePart: string): "training" | null {
	const c = resourcePart.trim().toLowerCase();
	if (!c) return null;
	// trainee, training, and coordinator permissions all show in the training row
	if (c === "trainee" || c.includes("training") || c.includes("coordinator")) return "training";
	return null;
}

/** Map API permission names to grid slots (`resource:read`, `Resource.Read`, `training_read`, `training:extra:read`). */
function permissionNameToGridCell(
	name: string
): { resource: string; slot: "write" | "read" | "delete" } | null {
	const trimmed = name.trim();
	if (!trimmed) return null;

	// Colon-based: training:read, coordinator:write, read:trainee, etc.
	const colonIdx = trimmed.indexOf(":");
	if (colonIdx !== -1) {
		const resource = trimmed.slice(0, colonIdx).trim() || "other";
		const rest = trimmed.slice(colonIdx + 1).trim().toLowerCase();
		
		// Direct slot (training:read)
		if (rest === "write" || rest === "read" || rest === "delete") {
			return { resource, slot: rest };
		}
		
		// Multi-part: training:something:read
		const lastColon = trimmed.lastIndexOf(":");
		if (lastColon > colonIdx) {
			const rawLast = trimmed.slice(lastColon + 1).trim().toLowerCase();
			if (rawLast === "write" || rawLast === "read" || rawLast === "delete") {
				return { resource, slot: rawLast };
			}
		}
	}

	// Dot-based: training.read, Resource.Write
	const dot = /\.(write|read|delete)$/i.exec(trimmed);
	if (dot) {
		const resource = trimmed.slice(0, dot.index).trim() || "other";
		const slot = dot[1].toLowerCase() as "write" | "read" | "delete";
		return { resource, slot };
	}

	// Underscore/dash-based: training_read, training-write, coordinator_read
	const underscore = /^(\w+)[-_](read|write|delete)$/i.exec(trimmed);
	if (underscore) {
		const resource = underscore[1].trim() || "other";
		const slot = underscore[2].toLowerCase() as "write" | "read" | "delete";
		return { resource, slot };
	}

	return null;
}

/** Backfill training grid slots when catalog uses canonical names (case/spacing variants). */
function mergeTrainingSlotsFromMenuCatalog(
	catalog: Permission[],
	trainingMerged: { write?: string; read?: string; delete?: string }
) {
	const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
	const byName = new Map<string, Permission>();
	for (const p of catalog) {
		byName.set(norm(p.name), p);
	}
	
	// Try to map canonical TRAINING_MENU_PERMISSIONS names into training slots
	for (const raw of TRAINING_MENU_PERMISSIONS) {
		const p = byName.get(norm(raw));
		if (!p?._id) continue;
		
		// Extract slot from various formats: "trainee.read", "training:write", "coordinator-delete"
		let slot: "read" | "write" | "delete" | null = null;
		
		// Colon-based: "training:read"
		if (raw.includes(":")) {
			const lastPart = raw.split(":").pop()?.toLowerCase();
			if (lastPart === "read" || lastPart === "write" || lastPart === "delete") {
				slot = lastPart;
			}
		}
		// Dot-based: "trainee.read"
		else if (raw.includes(".")) {
			const lastPart = raw.split(".").pop()?.toLowerCase();
			if (lastPart === "read" || lastPart === "write" || lastPart === "delete") {
				slot = lastPart;
			}
		}
		// Dash/underscore-based: "training-read"
		else {
			const lastPart = raw.split(/[-_]/).pop()?.toLowerCase();
			if (lastPart === "read" || lastPart === "write" || lastPart === "delete") {
				slot = lastPart;
			}
		}
		
		if (slot) {
			trainingMerged[slot] = trainingMerged[slot] ?? p._id;
		}
	}
}

type GroupedRolePermission = {
	resource: string;
	read?: Permission;
	write?: Permission;
	delete?: Permission;
	other: Permission[];
};

/** Group a role's permissions by resource (same naming rules as the create-role grid). */
function groupRolePermissionsByResource(
	permissions: Permission[]
): GroupedRolePermission[] {
	const grouped = new Map<
		string,
		{
			read?: Permission;
			write?: Permission;
			delete?: Permission;
			other: Permission[];
		}
	>();

	for (const permission of permissions) {
		const [resourcePart, actionPart] = permission.name.split(":");
		const resource = (resourcePart || "other").trim();
		const rawAction = (actionPart || permission.name).trim().toLowerCase();
		const bucket = grouped.get(resource) ?? { other: [] };

		if (rawAction === "write") {
			bucket.write = permission;
		} else if (rawAction === "read") {
			bucket.read = permission;
		} else if (rawAction === "delete") {
			bucket.delete = permission;
		} else {
			bucket.other.push(permission);
		}
		grouped.set(resource, bucket);
	}

	return Array.from(grouped.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([resource, actions]) => ({
			resource,
			read: actions.read,
			write: actions.write,
			delete: actions.delete,
			other: actions.other,
		}));
}

const RolesPage = () => {
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
	const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
	const [editDetailFetchId, setEditDetailFetchId] = useState<string | null>(null);
	const [roleForPermissionsView, setRoleForPermissionsView] = useState<Role | null>(
		null
	);
	const [roleDetailFetchId, setRoleDetailFetchId] = useState<string | null>(null);
	const [roles, setRoles] = useState<Role[]>([]);
	const [permissions, setPermissions] = useState<Permission[]>([]);
	const permissionsRef = useRef<Permission[]>(permissions);
	permissionsRef.current = permissions;
	/** One `resetEdit` per edit-sheet open so role-detail refetches do not wipe checkbox toggles. */
	const editRoleFormHydratedKey = useRef<string | null>(null);
	const {
		register,
		handleSubmit,
		watch,
		reset,
		setValue,
		formState: { errors },
	} = useForm<CreateRoleInput>({
		resolver: zodResolver(createRoleSchema),
		defaultValues: {
			name: "",
			description: "",
			permissionIds: [],
		},
	});

	const {
		register: registerEdit,
		handleSubmit: handleSubmitEdit,
		watch: watchEdit,
		reset: resetEdit,
		setValue: setEditValue,
		formState: { errors: editErrors },
	} = useForm<EditRoleInput>({
		resolver: zodResolver(editRoleSchema),
		defaultValues: {
			name: "",
			description: "",
			permissionIds: [],
		},
	});

	const {
		data: permissionsData,
		isLoading: isPermissionsLoading,
		isSuccess: isPermissionsSuccess
	} = api.Access.getPermissions.useQuery();

	const {
		data: rolesData,
		isLoading: isRolesLoading,
		isSuccess: isRolesSuccess
	} = api.Access.getRoles.useQuery();

	const {
		data: roleDetailData,
		isFetching: isRoleDetailFetching,
		isError: isRoleDetailError,
	} = api.Access.getRole.useQuery(roleDetailFetchId);

	const {
		data: editRoleDetailData,
		isFetching: isEditRoleDetailFetching,
		isError: isEditRoleDetailError,
	} = api.Access.getRole.useQuery(editDetailFetchId);

	const {
		mutate: createRole,
		isPending: isCreatingRole
	} = api.Access.createRole.useMutation();

	const {
		mutate: updateRole,
		isPending: isUpdatingRole,
	} = api.Access.updateRole.useMutation();


	useEffect(() => {
		if (isPermissionsSuccess && permissionsData) {
			setPermissions(permissionsData.permissions);
		}
	}, [isPermissionsSuccess, permissionsData]);

	useEffect(() => {
		if (isRolesSuccess && rolesData) {
			const coord = rolesData.roles.find((r) => r.name === "coordinator");
			
			setRoles(rolesData.roles);
		}
	}, [isRolesSuccess, rolesData]);

	useEffect(() => {
		if (!roleDetailFetchId || !roleDetailData) return;
		if (roleDetailData._id !== roleDetailFetchId) return;
		setRoleForPermissionsView(roleDetailData);
		setRoleDetailFetchId(null);
	}, [roleDetailData, roleDetailFetchId]);

	useEffect(() => {
		if (!isRoleDetailError || !roleDetailFetchId) return;
		toast.error("Could not load role permissions.");
		setRoleDetailFetchId(null);
	}, [isRoleDetailError, roleDetailFetchId]);

	useEffect(() => {
		if (!isEditSheetOpen) {
			editRoleFormHydratedKey.current = null;
			return;
		}
		if (!editDetailFetchId || !editRoleDetailData) return;
		if (editRoleDetailData._id !== editDetailFetchId) return;
		if (isEditRoleDetailFetching) return;
		if (permissionsRef.current.length === 0) return;

		const hydrateKey = editDetailFetchId;
		if (editRoleFormHydratedKey.current === hydrateKey) return;

		const ids = resolveRolePermissions(editRoleDetailData, permissionsRef.current).map(
			(p) => p._id
		);
		resetEdit({
			name: editRoleDetailData.name,
			description: editRoleDetailData.description ?? "",
			permissionIds: ids,
		});
		editRoleFormHydratedKey.current = hydrateKey;
	}, [
		isEditSheetOpen,
		editDetailFetchId,
		editRoleDetailData,
		isEditRoleDetailFetching,
		permissions.length,
		resetEdit,
	]);

	useEffect(() => {
		if (!isEditRoleDetailError || !editDetailFetchId) return;
		toast.error("Could not load role for editing.");
		setEditDetailFetchId(null);
		setEditingRoleId(null);
		setIsEditSheetOpen(false);
	}, [isEditRoleDetailError, editDetailFetchId]);

	useEffect(() => {
		if (!roleForPermissionsView) return;
		const rawLen = roleForPermissionsView.permissions?.length ?? 0;
		const resolved = resolveRolePermissions(roleForPermissionsView, permissions);
		// #region agent log
		
		// #endregion
	}, [roleForPermissionsView, permissions]);

	const permissionIds = watch("permissionIds") ?? [];
	const editPermissionIds = watchEdit("permissionIds") ?? [];

	const selectedEditPermissionsCount = useMemo(
		() => editPermissionIds.length,
		[editPermissionIds.length]
	);

	const selectedPermissionsCount = useMemo(
		() => permissionIds.length,
		[permissionIds.length]
	);

	const { permissionsByResource, orphanPermissions, hasTrainingPermissionSlots } = useMemo(() => {
		const grouped = new Map<
			string,
			{ write?: string; read?: string; delete?: string }
		>();
		const orphans: Permission[] = [];

		for (const permission of permissions) {
			const cell = permissionNameToGridCell(permission.name);
			if (!cell) {
				orphans.push(permission);
				continue;
			}

			const collapsed = trainingGridResourceKey(cell.resource);
			const resourceKey =
				collapsed === "training" || collapsed === "coordinator"
					? collapsed
					: cell.resource.trim();

			const existing = grouped.get(resourceKey) ?? {};
			if (cell.slot === "write") {
				existing.write = permission._id;
			} else if (cell.slot === "read") {
				existing.read = permission._id;
			} else {
				existing.delete = permission._id;
			}

			grouped.set(resourceKey, existing);
		}

		// Single "training" row for Training manage sidebar: use training:*, or fall back to coordinator:*
		const trainingMerged = { ...(grouped.get("training") ?? {}) };
		const coordinatorSlots = grouped.get("coordinator");
		if (coordinatorSlots) {
			trainingMerged.read = trainingMerged.read ?? coordinatorSlots.read;
			trainingMerged.write = trainingMerged.write ?? coordinatorSlots.write;
			trainingMerged.delete = trainingMerged.delete ?? coordinatorSlots.delete;
			grouped.delete("coordinator");
		}
		mergeTrainingSlotsFromMenuCatalog(permissions, trainingMerged);
		grouped.set("training", trainingMerged);

		const hasTrainingPermissionSlots = Boolean(
			trainingMerged.read || trainingMerged.write || trainingMerged.delete
		);

		// #region agent log
		{
			const trainish = permissions.filter((p) => /train|coordinat/i.test(p.name));
			const trainishMeta = trainish.map((p) => {
				const cell = permissionNameToGridCell(p.name);
				const collapsed = cell ? trainingGridResourceKey(cell.resource) : null;
				const rk =
					collapsed === "training" || collapsed === "coordinator"
						? collapsed
						: cell?.resource.trim();
				return {
					name: p.name,
					idPresent: Boolean(p._id && String(p._id).length > 0),
					cell,
					collapsed,
					resourceKey: rk ?? null,
				};
			});
			const orphanTrainish = orphans
				.filter((p) => /train|coordinat/i.test(p.name))
				.map((p) => p.name);
			
		}
		// #endregion

		return {
			permissionsByResource: Array.from(grouped.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([resource, actions]) => ({
					resource,
					actions,
				})),
			hasTrainingPermissionSlots,
			orphanPermissions: orphans,
		};
	}, [permissions]);

	const toggleEditPermission = (id: string, checked: boolean) => {
		const nextPermissionIds = checked
			? Array.from(new Set([...editPermissionIds, id]))
			: editPermissionIds.filter((permissionId) => permissionId !== id);

		setEditValue("permissionIds", nextPermissionIds, {
			shouldDirty: true,
			shouldValidate: true,
		});
	};

	const togglePermission = (id: string, checked: boolean) => {
		const nextPermissionIds = checked
			? Array.from(new Set([...permissionIds, id]))
			: permissionIds.filter((permissionId) => permissionId !== id);

		setValue("permissionIds", nextPermissionIds, {
			shouldDirty: true,
			shouldValidate: true,
		});
	};

	const openEditRole = (role: Role) => {
		setEditingRoleId(role._id);
		setEditDetailFetchId(role._id);
		setIsEditSheetOpen(true);
		resetEdit({
			name: role.name,
			description: role.description ?? "",
			permissionIds: resolveRolePermissions(role, permissions).map((p) => p._id),
		});
	};

	const handleCreateRole = (data: CreateRoleInput) => {
		createRole({
			name: data.name,
			description: data.description,
			permissionIds: data.permissionIds
		},{
			onSuccess: (data) => {
				setRoles((prev) => [...prev, data.role]);
				setIsSheetOpen(false);
				reset();
			}
		});
	};

	const handleUpdateRole = (data: EditRoleInput) => {
		if (!editingRoleId) return;
		if (data.permissionIds.length === 0) {
			const ok = window.confirm(
				"Remove all permissions from this role? Users with this role may lose access until permissions are assigned again."
			);
			if (!ok) return;
		}
		updateRole(
			{
				roleId: editingRoleId,
				name: data.name,
				description: data.description,
				permissionIds: data.permissionIds,
			},
			{
				onSuccess: (res) => {
					toast.success(res.message || "Role updated successfully");
					setIsEditSheetOpen(false);
					setEditingRoleId(null);
					setEditDetailFetchId(null);
					resetEdit();
				},
				onError: () => {
					toast.error("Could not update role.");
				},
			}
		);
	};

	const viewPermissionsResolved = useMemo(() => {
		if (!roleForPermissionsView) return [];
		return resolveRolePermissions(roleForPermissionsView, permissions);
	}, [roleForPermissionsView, permissions]);

	const viewGroupedPermissions = useMemo(
		() =>
			viewPermissionsResolved.length > 0
				? groupRolePermissionsByResource(viewPermissionsResolved)
				: [],
		[viewPermissionsResolved]
	);

	const viewPermissionCount = viewPermissionsResolved.length;

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-[28px] font-bold tracking-tight text-black">
						Roles
					</h1>
					<p className="font-medium text-zinc-500">Manage system roles</p>
				</div>

				<Button
					className="h-11 rounded-xl bg-[#3B82F6] px-6 font-bold text-white shadow-md hover:bg-blue-600"
					onClick={() => setIsSheetOpen(true)}
				>
					<Plus className="mr-1 h-5 w-5" />
					New Role
				</Button>
			</div>

			<div className="rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
				<div className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
					Total: {roles.length} Roles
				</div>

				<div className="overflow-hidden rounded-2xl border border-gray-100">
					<Table className="w-full table-fixed">
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className="h-10 min-w-0 px-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-6">
									Role
								</TableHead>
								<TableHead className="h-10 w-28 shrink-0 px-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:w-36 sm:px-6">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isRolesLoading ? (
								<TableRow>
									<TableCell colSpan={2} className="h-24 text-center">
										<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
										Loading roles...
									</TableCell>
								</TableRow>
							) : roles.length === 0 ? (
								<TableRow>
									<TableCell colSpan={2} className="h-24 text-center text-gray-500">
										No roles found.
									</TableCell>
								</TableRow>
							) : (
								roles.map((role) => (
									<TableRow key={role._id} className="border-gray-50 hover:bg-slate-50/50">
										<TableCell className="min-w-0 px-4 py-2.5 font-semibold text-gray-700 sm:px-6">
											<span className="block truncate">{role.name}</span>
										</TableCell>
										<TableCell className="w-28 shrink-0 px-4 py-2.5 text-right sm:w-36 sm:px-6">
											<div className="flex justify-end gap-1">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:h-9 sm:w-9"
													aria-label={`View permissions for ${role.name}`}
													onClick={() => {
														setRoleForPermissionsView(role);
														const resolved = resolveRolePermissions(
															role,
															permissions
														);
														if (resolved.length === 0 && role._id) {
															setRoleDetailFetchId(role._id);
														} else {
															setRoleDetailFetchId(null);
														}
													}}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:h-9 sm:w-9"
													aria-label={`Edit role ${role.name}`}
													onClick={() => openEditRole(role)}
												>
													<Pencil className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

			<Dialog
				open={Boolean(roleForPermissionsView)}
				onOpenChange={(open) => {
					if (!open) {
						setRoleForPermissionsView(null);
						setRoleDetailFetchId(null);
					}
				}}
			>
				<DialogContent className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-xl">
					<DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
						<DialogTitle className="pr-8 text-xl font-semibold tracking-tight text-slate-900">
							{roleForPermissionsView?.name ?? "Role"}
						</DialogTitle>
						<DialogDescription className="sr-only">
							Permissions assigned to this role.
						</DialogDescription>
						<p className="text-xs font-medium text-muted-foreground">
							{isRoleDetailFetching
								? "Loading permissions..."
								: viewPermissionCount === 0
									? "No permissions"
									: `${viewPermissionCount} permission${viewPermissionCount === 1 ? "" : "s"}`}
						</p>
					</DialogHeader>

					<div className="max-h-[60vh] overflow-y-auto px-6 py-4">
						{isRoleDetailFetching ? (
							<div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
								<Loader2 className="mr-2 h-5 w-5 animate-spin" />
								Loading permissions…
							</div>
						) : viewPermissionCount === 0 ? (
							<p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
								This role has no permissions assigned yet.
							</p>
						) : (
							<ul className="space-y-4">
								{viewGroupedPermissions.map((group) => (
									<li
										key={group.resource}
										className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm"
									>
										<p className="text-sm font-semibold capitalize text-slate-900">
											{group.resource}
										</p>
										<div className="mt-2 flex flex-wrap gap-2">
											{group.write ? (
												<Badge variant="secondary" className="font-medium">
													Write
												</Badge>
											) : null}
											{group.read ? (
												<Badge variant="secondary" className="font-medium">
													Read
												</Badge>
											) : null}
											{group.delete ? (
												<Badge variant="destructive" className="font-medium">
													Delete
												</Badge>
											) : null}
										</div>
										{group.other.length > 0 ? (
											<ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
												{group.other.map((p) => (
													<li key={p._id} className="text-sm">
														<span className="font-mono text-xs text-slate-800">
															{p.name}
														</span>
														{p.description?.trim() ? (
															<span className="mt-0.5 block text-xs text-muted-foreground">
																{p.description}
															</span>
														) : null}
													</li>
												))}
											</ul>
										) : null}
									</li>
								))}
							</ul>
						)}
					</div>

					<DialogFooter className="border-t border-slate-100 px-6 py-4 sm:justify-center">
						<Button
							type="button"
							variant="default"
							className="min-w-[7rem]"
							onClick={() => {
								setRoleForPermissionsView(null);
								setRoleDetailFetchId(null);
							}}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Sheet
				open={isSheetOpen}
				onOpenChange={(open) => {
					setIsSheetOpen(open);
					if (!open) reset();
				}}
			>
				<SheetContent side="right" className="w-full sm:max-w-xl">
					<SheetHeader>
						<SheetTitle>Create New Role</SheetTitle>
						<SheetDescription>
							Set role name, description, and permissions.
						</SheetDescription>
					</SheetHeader>

					<form
						onSubmit={handleSubmit(handleCreateRole)}
						className="flex h-full flex-col px-4 pb-4"
					>
						<div className="space-y-4 overflow-y-auto">
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700" htmlFor="role-name">
									Name
								</label>
								<Input
									id="role-name"
									placeholder="Role name"
									{...register("name")}
								/>
								{errors.name?.message ? (
									<p className="text-xs text-red-600">{errors.name.message}</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label
									className="text-sm font-medium text-gray-700"
									htmlFor="role-description"
								>
									Description
								</label>
								<Textarea
									id="role-description"
									placeholder="Role description"
									{...register("description")}
								/>
								{errors.description?.message ? (
									<p className="text-xs text-red-600">{errors.description.message}</p>
								) : null}
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium text-gray-700">Permissions</p>
									<p className="text-xs text-gray-500">
										Selected: {selectedPermissionsCount}
									</p>
								</div>

								<div className="max-h-72 overflow-y-auto rounded-md border">
									{isPermissionsLoading ? (
										<div className="p-3 text-sm text-gray-500">Loading permissions...</div>
									) : permissions.length === 0 ? (
										<div className="p-3 text-sm text-gray-500">No permissions found.</div>
									) : (
										<>
											<table className="w-full text-sm">
												<thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
													<tr>
														<th className="px-3 py-2 font-semibold">Resource</th>
														<th className="px-3 py-2 font-semibold">Write</th>
														<th className="px-3 py-2 font-semibold">Read</th>
														<th className="px-3 py-2 font-semibold">Delete</th>
													</tr>
												</thead>
												<tbody>
													{permissionsByResource.map((group) => (
														<tr key={group.resource} className="border-t border-slate-100">
															<td className="px-3 py-2 font-medium capitalize text-slate-700">
																{group.resource}
															</td>
															<td className="px-3 py-2">
																<Checkbox
																	checked={
																		group.actions.write
																			? permissionIds.includes(group.actions.write)
																			: false
																	}
																	disabled={!group.actions.write}
																	onCheckedChange={(checked) => {
																		if (!group.actions.write) return;
																		togglePermission(group.actions.write, checked === true);
																	}}
																/>
															</td>
															<td className="px-3 py-2">
																<Checkbox
																	checked={
																		group.actions.read
																			? permissionIds.includes(group.actions.read)
																			: false
																	}
																	disabled={!group.actions.read}
																	onCheckedChange={(checked) => {
																		if (!group.actions.read) return;
																		togglePermission(group.actions.read, checked === true);
																	}}
																/>
															</td>
															<td className="px-3 py-2">
																<Checkbox
																	checked={
																		group.actions.delete
																			? permissionIds.includes(group.actions.delete)
																			: false
																	}
																	disabled={!group.actions.delete}
																	onCheckedChange={(checked) => {
																		if (!group.actions.delete) return;
																		togglePermission(group.actions.delete, checked === true);
																	}}
																/>
															</td>
														</tr>
													))}
												</tbody>
											</table>
											{!hasTrainingPermissionSlots ? (
												<p className="border-t border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
													Training permissions are not configured by the backend yet, so the
													training row checkboxes are disabled.
												</p>
											) : null}
											{orphanPermissions.length > 0 ? (
												<div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-3 py-3">
													<p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
														Other permissions
													</p>
													<ul className="space-y-2">
														{orphanPermissions.map((p) => (
															<li key={p._id} className="flex items-start gap-2">
																<Checkbox
																	id={`create-orphan-${p._id}`}
																	className="mt-0.5"
																	checked={permissionIds.includes(p._id)}
																	onCheckedChange={(checked) => {
																		togglePermission(p._id, checked === true);
																	}}
																/>
																<label
																	htmlFor={`create-orphan-${p._id}`}
																	className="cursor-pointer text-xs leading-snug"
																>
																	<span className="font-mono text-slate-800">{p.name}</span>
																	{p.description?.trim() ? (
																		<span className="mt-0.5 block text-muted-foreground">
																			{p.description}
																		</span>
																	) : null}
																</label>
															</li>
														))}
													</ul>
												</div>
											) : null}
										</>
									)}
								</div>
								{errors.permissionIds?.message ? (
									<p className="text-xs text-red-600">{errors.permissionIds.message}</p>
								) : null}
							</div>
						</div>

						<SheetFooter className="px-0 pt-4">
							<div className="flex w-full justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsSheetOpen(false);
										reset();
									}}
								>
									Cancel
								</Button>
								<Button type="submit">
									{isCreatingRole ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Create Role
								</Button>
							</div>	
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>

			<Sheet
				open={isEditSheetOpen}
				onOpenChange={(open) => {
					setIsEditSheetOpen(open);
					if (!open) {
						setEditingRoleId(null);
						setEditDetailFetchId(null);
						resetEdit();
					}
				}}
			>
				<SheetContent side="right" className="w-full sm:max-w-xl">
					<SheetHeader>
						<SheetTitle>Edit Role</SheetTitle>
						<SheetDescription>
							Update role name, description, and permissions. Re-login may be required for
							permission changes to apply to your session.
						</SheetDescription>
					</SheetHeader>

					{isEditRoleDetailFetching ? (
						<p className="px-4 text-xs text-muted-foreground">
							<Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
							Loading latest role data…
						</p>
					) : null}

					<form
						onSubmit={handleSubmitEdit(handleUpdateRole)}
						className="flex h-full flex-col px-4 pb-4"
					>
						<div className="space-y-4 overflow-y-auto">
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700" htmlFor="edit-role-name">
									Name
								</label>
								<Input
									id="edit-role-name"
									placeholder="Role name"
									disabled={isEditRoleDetailFetching}
									{...registerEdit("name")}
								/>
								{editErrors.name?.message ? (
									<p className="text-xs text-red-600">{editErrors.name.message}</p>
								) : null}
							</div>

							<div className="space-y-2">
								<label
									className="text-sm font-medium text-gray-700"
									htmlFor="edit-role-description"
								>
									Description
								</label>
								<Textarea
									id="edit-role-description"
									placeholder="Role description"
									disabled={isEditRoleDetailFetching}
									{...registerEdit("description")}
								/>
								{editErrors.description?.message ? (
									<p className="text-xs text-red-600">{editErrors.description.message}</p>
								) : null}
							</div>

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium text-gray-700">Permissions</p>
									<p className="text-xs text-gray-500">
										Selected: {selectedEditPermissionsCount}
									</p>
								</div>

								<div className="max-h-72 overflow-y-auto rounded-md border">
									{isPermissionsLoading ? (
										<div className="p-3 text-sm text-gray-500">Loading permissions...</div>
									) : permissions.length === 0 ? (
										<div className="p-3 text-sm text-gray-500">No permissions found.</div>
									) : (
										<>
											<table className="w-full text-sm">
												<thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
													<tr>
														<th className="px-3 py-2 font-semibold">Resource</th>
														<th className="px-3 py-2 font-semibold">Write</th>
														<th className="px-3 py-2 font-semibold">Read</th>
														<th className="px-3 py-2 font-semibold">Delete</th>
													</tr>
												</thead>
												<tbody>
													{permissionsByResource.map((group) => (
														<tr key={group.resource} className="border-t border-slate-100">
															<td className="px-3 py-2 font-medium capitalize text-slate-700">
																{group.resource}
															</td>
															<td className="px-3 py-2">
																<Checkbox
																	checked={
																		group.actions.write
																			? editPermissionIds.includes(group.actions.write)
																			: false
																	}
																	disabled={
																		!group.actions.write || isEditRoleDetailFetching
																	}
																	onCheckedChange={(checked) => {
																		if (!group.actions.write) return;
																		toggleEditPermission(
																			group.actions.write,
																			checked === true
																		);
																	}}
																/>
															</td>
															<td className="px-3 py-2">
																<Checkbox
																	checked={
																		group.actions.read
																			? editPermissionIds.includes(group.actions.read)
																			: false
																	}
																	disabled={
																		!group.actions.read || isEditRoleDetailFetching
																	}
																	onCheckedChange={(checked) => {
																		if (!group.actions.read) return;
																		toggleEditPermission(
																			group.actions.read,
																			checked === true
																		);
																	}}
																/>
															</td>
															<td className="px-3 py-2">
																<Checkbox
																	checked={
																		group.actions.delete
																			? editPermissionIds.includes(group.actions.delete)
																			: false
																	}
																	disabled={
																		!group.actions.delete || isEditRoleDetailFetching
																	}
																	onCheckedChange={(checked) => {
																		if (!group.actions.delete) return;
																		toggleEditPermission(
																			group.actions.delete,
																			checked === true
																		);
																	}}
																/>
															</td>
														</tr>
													))}
												</tbody>
											</table>
											{!hasTrainingPermissionSlots ? (
												<p className="border-t border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
													Training permissions are not configured by the backend yet, so the
													training row checkboxes are disabled.
												</p>
											) : null}
											{orphanPermissions.length > 0 ? (
												<div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-3 py-3">
													<p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
														Other permissions
													</p>
													<ul className="space-y-2">
														{orphanPermissions.map((p) => (
															<li key={p._id} className="flex items-start gap-2">
																<Checkbox
																	id={`edit-orphan-${p._id}`}
																	className="mt-0.5"
																	checked={editPermissionIds.includes(p._id)}
																	disabled={isEditRoleDetailFetching}
																	onCheckedChange={(checked) => {
																		toggleEditPermission(p._id, checked === true);
																	}}
																/>
																<label
																	htmlFor={`edit-orphan-${p._id}`}
																	className="cursor-pointer text-xs leading-snug"
																>
																	<span className="font-mono text-slate-800">{p.name}</span>
																	{p.description?.trim() ? (
																		<span className="mt-0.5 block text-muted-foreground">
																			{p.description}
																		</span>
																	) : null}
																</label>
															</li>
														))}
													</ul>
												</div>
											) : null}
										</>
									)}
								</div>
							</div>
						</div>

						<SheetFooter className="px-0 pt-4">
							<div className="flex w-full justify-end gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsEditSheetOpen(false);
										setEditingRoleId(null);
										setEditDetailFetchId(null);
										resetEdit();
									}}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isUpdatingRole || isEditRoleDetailFetching}>
									{isUpdatingRole ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Save changes
								</Button>
							</div>
						</SheetFooter>
					</form>
				</SheetContent>
			</Sheet>
		</div>
	);
}



export default RolesPage;
