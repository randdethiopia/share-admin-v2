"use client";

import React, { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import PaginationControls from "@/components/shared/PaginationControls";
import { DEFAULT_PAGE_SIZE, getPaginationMeta } from "@/lib/pagination";

type RoleRow = {
	id: string;
	name: string;
	permissions: string[];
	updatedAt: string;
};

const MOCK_ROLES: RoleRow[] = [
	{
		id: "role-admin",
		name: "Admin",
		permissions: ["Manage users", "View analytics", "Edit settings", "Create roles"],
		updatedAt: "2026-02-20T09:30:00Z",
	},
	{
		id: "role-editor",
		name: "Editor",
		permissions: ["Edit content", "Publish posts"],
		updatedAt: "2026-02-18T15:10:00Z",
	},
	{
		id: "role-viewer",
		name: "Viewer",
		permissions: ["View dashboards"],
		updatedAt: "2026-02-12T12:45:00Z",
	},
	{
		id: "role-support",
		name: "Support",
		permissions: ["Respond to tickets", "View users", "View reports"],
		updatedAt: "2026-02-07T08:05:00Z",
	},
];

const formatPermissions = (permissions: string[]) => {
	if (permissions.length <= 2) return permissions.join(", ");
	return `${permissions.slice(0, 2).join(", ")} ...`;
};

const formatUpdatedAt = (value?: string) => {
	if (!value) return "-";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "-";
	return parsed.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};

export default function AccessManagementPage() {
	const [roles, setRoles] = useState<RoleRow[]>(MOCK_ROLES);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);
	const [roleSheetOpen, setRoleSheetOpen] = useState(false);
	const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
	const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
	const [roleName, setRoleName] = useState("");
	const [rolePermissions, setRolePermissions] = useState<string[]>([]);
	const [permissionInput, setPermissionInput] = useState("");
	const [createError, setCreateError] = useState<string | null>(null);
	const [deleteRole, setDeleteRole] = useState<RoleRow | null>(null);
	const pageSize = DEFAULT_PAGE_SIZE;

	const filteredRoles = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return roles;
		return roles.filter((role) => {
			const hasName = role.name.toLowerCase().includes(term);
			const hasPermission = role.permissions.some((permission) =>
				permission.toLowerCase().includes(term)
			);
			return hasName || hasPermission;
		});
	}, [roles, search]);

	const paginationMeta = useMemo(
		() => getPaginationMeta(filteredRoles.length, page, pageSize),
		[filteredRoles.length, page, pageSize]
	);

	const pagedRoles = useMemo(
		() =>
			filteredRoles.slice(
				paginationMeta.startIndex,
				paginationMeta.endIndexExclusive
			),
		[filteredRoles, paginationMeta.endIndexExclusive, paginationMeta.startIndex]
	);

	const openDetails = (role: RoleRow) => {
		setSelectedRole(role);
		setSheetOpen(true);
	};

	const handleSheetChange = (open: boolean) => {
		setSheetOpen(open);
		if (!open) {
			setSelectedRole(null);
		}
	};

	const handleRoleSheetChange = (open: boolean) => {
		setRoleSheetOpen(open);
		if (!open) {
			setSheetMode("create");
			setEditingRoleId(null);
			setRoleName("");
			setRolePermissions([]);
			setPermissionInput("");
			setCreateError(null);
		}
	};

	const openCreateRole = () => {
		setSheetMode("create");
		setEditingRoleId(null);
		setRoleName("");
		setRolePermissions([]);
		setPermissionInput("");
		setCreateError(null);
		setRoleSheetOpen(true);
	};

	const openEditRole = (role: RoleRow) => {
		setSheetMode("edit");
		setEditingRoleId(role.id);
		setRoleName(role.name);
		setRolePermissions(role.permissions);
		setPermissionInput("");
		setCreateError(null);
		setRoleSheetOpen(true);
	};

	const handleAddPermission = () => {
		const items = permissionInput
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);

		if (items.length === 0) {
			setCreateError("Enter at least one permission.");
			return;
		}

		setRolePermissions((prev) => {
			const existing = new Set(prev.map((permission) => permission.toLowerCase()));
			const next = [...prev];
			items.forEach((item) => {
				if (!existing.has(item.toLowerCase())) {
					next.push(item);
					existing.add(item.toLowerCase());
				}
			});
			return next;
		});
		setPermissionInput("");
		setCreateError(null);
	};

	const handleRemovePermission = (permission: string) => {
		setRolePermissions((prev) =>
			prev.filter((item) => item.toLowerCase() !== permission.toLowerCase())
		);
	};

	const handleDeleteRole = () => {
		if (!deleteRole) return;
		setRoles((prev) => prev.filter((role) => role.id !== deleteRole.id));
		if (selectedRole?.id === deleteRole.id) {
			setSheetOpen(false);
			setSelectedRole(null);
		}
		if (editingRoleId === deleteRole.id) {
			setRoleSheetOpen(false);
		}
		toast.success("Role deleted successfully.");
		setDeleteRole(null);
	};

	const handleRoleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmedName = roleName.trim();
		const permissions = rolePermissions.map((permission) => permission.trim());

		if (!trimmedName) {
			setCreateError("Role name is required.");
			return;
		}

		if (permissions.length === 0) {
			setCreateError("Add at least one permission.");
			return;
		}

		const exists = roles.some(
			(role) =>
				role.name.toLowerCase() === trimmedName.toLowerCase() &&
				role.id !== editingRoleId
		);
		if (exists) {
			setCreateError("Role name already exists.");
			return;
		}

		const updatedAt = new Date().toISOString();
		if (sheetMode === "edit" && editingRoleId) {
			setRoles((prev) =>
				prev.map((role) =>
					role.id === editingRoleId
						? { ...role, name: trimmedName, permissions, updatedAt }
						: role
				)
			);
			toast.success("Role updated successfully.");
		} else {
			setRoles((prev) => [
				{
					id: `role-${trimmedName.toLowerCase().replace(/\s+/g, "-")}`,
					name: trimmedName,
					permissions,
					updatedAt,
				},
				...prev,
			]);
			toast.success("Role created successfully.");
		}
		setRoleSheetOpen(false);
	};

	return (
		<div className="space-y-6">
			{/* HEADER */}
			<div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-[28px] font-bold text-black tracking-tight">
						Roles & Permissions
					</h1>
					<p className="text-zinc-500 font-medium">
						Manage access across the platform
					</p>
				</div>
				<Button
					onClick={openCreateRole}
					className="h-11 rounded-xl bg-[#3B82F6] px-6 font-bold text-white shadow-md hover:bg-blue-600"
				>
					<span className="inline-flex items-center">
						<Plus className="mr-1 h-5 w-5" /> New Role
					</span>
				</Button>
			</div>

			{/* MASTER CONTAINER */}
			<div className="rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
				{/* TOP BAR */}
				<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative w-full sm:max-w-sm">
						<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input
							placeholder="Search role or permission..."
							className="h-12 rounded-xl border-none bg-[#F3F8FF] pl-11 text-sm"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setPage(1);
							}}
						/>
					</div>
					
				</div>

				{/* TABLE */}
				<div className="overflow-x-auto rounded-2xl border border-gray-100">
					<Table className="min-w-180">
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Role Name
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Permissions
								</TableHead>
								<TableHead className="h-12 px-6 text-right text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRoles.length === 0 ? (
								<TableRow>
									<TableCell colSpan={3} className="h-40 text-center text-sm text-gray-500">
										No roles found.
									</TableCell>
								</TableRow>
							) : (
								pagedRoles.map((role) => (
									<TableRow
										key={role.id}
										className="border-gray-50 hover:bg-slate-50/50"
									>
										<TableCell className="px-6 py-5 font-bold text-gray-700 sm:px-8">
											{role.name}
										</TableCell>
										<TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
											{formatPermissions(role.permissions)}
										</TableCell>
										<TableCell className="px-6 py-5 text-right sm:px-8">
											<div className="flex items-center justify-end gap-2">
												<button
													onClick={() => openEditRole(role)}
													className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
													aria-label={`Edit ${role.name}`}
												>
													<Pencil size={15} />
												</button>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<button
															onClick={() => setDeleteRole(role)}
															className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100"
															aria-label={`Delete ${role.name}`}
														>
															<Trash2 size={15} />
														</button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Delete role</AlertDialogTitle>
															<AlertDialogDescription>
																Are you sure you want to delete {role.name}? This action cannot be undone.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancel</AlertDialogCancel>
															<AlertDialogAction
																onClick={handleDeleteRole}
																className="bg-red-600 hover:bg-red-700"
															>
																Delete
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
												<button
													onClick={() => openDetails(role)}
													className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
													aria-label={`View ${role.name} details`}
												>
													<Eye size={16} />
												</button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
                  <div className="text-xs font-bold text-gray-400 m-6">
						Total: {filteredRoles.length} Roles
					</div>
				<PaginationControls
					page={paginationMeta.safePage}
					onPageChange={setPage}
					totalItems={filteredRoles.length}
					pageSize={pageSize}
					disabled={false}
				/>
			</div>

			<Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
				<SheetContent side="right" className="w-full sm:max-w-md">
					<SheetHeader>
						<SheetTitle>Role Details</SheetTitle>
						<SheetDescription>
							Review permissions assigned to this role.
						</SheetDescription>
					</SheetHeader>
					<div className="space-y-6 px-4 pb-6">
						<div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium text-gray-500">
							Last updated: {formatUpdatedAt(selectedRole?.updatedAt)}
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase text-gray-400">
								Role Name
							</p>
							<p className="text-sm font-semibold text-gray-900">
								{selectedRole?.name ?? "-"}
							</p>
						</div>
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase text-gray-400">
								Permissions
							</p>
							<div className="flex flex-col gap-2">
								{selectedRole?.permissions?.length ? (
									selectedRole.permissions.map((permission) => (
										<div
											key={permission}
											className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-gray-600"
										>
											{permission}
										</div>
									))
								) : (
									<p className="text-sm text-gray-500">No permissions assigned.</p>
								)}
							</div>
						</div>
					</div>
				</SheetContent>
			</Sheet>

			<Sheet open={roleSheetOpen} onOpenChange={handleRoleSheetChange}>
				<SheetContent side="right" className="w-full sm:max-w-md">
					<SheetHeader>
						<SheetTitle>
							{sheetMode === "edit" ? "Edit Role" : "Create New Role"}
						</SheetTitle>
						<SheetDescription>
							{sheetMode === "edit"
								? "Update role details and permissions."
								: "Define access levels and permissions for the team."}
						</SheetDescription>
					</SheetHeader>
					<form className="space-y-6 px-4 pb-6" onSubmit={handleRoleSubmit}>
						{sheetMode === "edit" ? (
							<div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium text-gray-500">
								Last updated: {formatUpdatedAt(
									roles.find((role) => role.id === editingRoleId)?.updatedAt
								)}
							</div>
						) : null}
						<div className="space-y-2">
							<label className="text-xs font-semibold uppercase text-gray-400">
								Role Name
							</label>
							<Input
								value={roleName}
								onChange={(event) => {
									setRoleName(event.target.value);
									setCreateError(null);
								}}
								placeholder="e.g. Finance Manager"
								className="h-11 rounded-xl"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-xs font-semibold uppercase text-gray-400">
								Permissions
							</label>
							<div className="flex flex-wrap gap-2">
								{rolePermissions.length ? (
									rolePermissions.map((permission) => (
										<span
											key={permission}
											className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
										>
											{permission}
											<button
												onClick={() => handleRemovePermission(permission)}
												className="text-slate-400 transition-colors hover:text-slate-700"
												aria-label={`Remove ${permission}`}
												type="button"
											>
												x
											</button>
										</span>
									))
								) : (
									<p className="text-xs text-gray-400">
										No permissions added yet.
									</p>
								)}
							</div>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
								<Input
									value={permissionInput}
									onChange={(event) => {
										setPermissionInput(event.target.value);
										setCreateError(null);
									}}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											handleAddPermission();
										}
									}}
									placeholder="Add permission and press Enter"
									className="h-11 rounded-xl"
								/>
								<Button
									type="button"
									variant="outline"
									className="h-11 rounded-xl"
									onClick={handleAddPermission}
								>
									Add
								</Button>
							</div>
							<p className="text-xs text-gray-400">
								Tip: Separate multiple permissions with commas.
							</p>
						</div>
						{createError ? (
							<p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
								{createError}
							</p>
						) : null}
						<div className="flex flex-col gap-3">
							<Button type="submit" className="h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
								{sheetMode === "edit" ? "Save Changes" : "Create Role"}
							</Button>
							<Button
								type="button"
								variant="outline"
								className="h-11 rounded-xl"
								onClick={() => setRoleSheetOpen(false)}
							>
								Cancel
							</Button>
						</div>
					</form>
				</SheetContent>
			</Sheet>
		</div>
	);
}
