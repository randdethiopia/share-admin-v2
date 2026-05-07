"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Permission, Role } from "@/lib/api/access";


const createRoleSchema = z.object({
	name: z.string().trim().min(1, "Role name is required"),
	description: z.string().trim().min(1, "Description is required"),
	permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

type CreateRoleInput = z.infer<typeof createRoleSchema>;

const RolesPage = () => {
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [roles, setRoles] = useState<Role[]>([]);
	const [permissions, setPermissions] = useState<Permission[]>([]);
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
		mutate: createRole,
		isPending: isCreatingRole
	} = api.Access.createRole.useMutation();


	useEffect(() => {
		if (isPermissionsSuccess && permissionsData) {
			setPermissions(permissionsData.permissions);
		}
	}, [isPermissionsSuccess, permissionsData]);

	useEffect(() => {
		if (isRolesSuccess && rolesData) {
			setRoles(rolesData.roles);
		}
	}, [isRolesSuccess, rolesData]);


	const permissionIds = watch("permissionIds") ?? [];

	const selectedPermissionsCount = useMemo(
		() => permissionIds.length,
		[permissionIds.length]
	);

	const permissionsByResource = useMemo(() => {
		const grouped = new Map<
			string,
			{ write?: string; read?: string; delete?: string }
		>();

		for (const permission of permissions) {
			const [resourcePart, actionPart] = permission.name.split(":");
			const resource = (resourcePart || "other").trim();
			const rawAction = (actionPart || permission.name).trim().toLowerCase();
			const existing = grouped.get(resource) ?? {};

			if (rawAction === "write") {
				existing.write = permission._id;
			} else if (rawAction === "read") {
				existing.read = permission._id;
			} else if (rawAction === "delete") {
				existing.delete = permission._id;
			}

			grouped.set(resource, existing);
		}

		return Array.from(grouped.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([resource, actions]) => ({
				resource,
				actions,
			}));
	}, [permissions]);

	const togglePermission = (id: string, checked: boolean) => {
		const nextPermissionIds = checked
			? Array.from(new Set([...permissionIds, id]))
			: permissionIds.filter((permissionId) => permissionId !== id);

		setValue("permissionIds", nextPermissionIds, {
			shouldDirty: true,
			shouldValidate: true,
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

	return (
		<div className="space-y-6">
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

			<div className="rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
				<div className="mb-4 text-xs font-bold text-gray-400">
					Total: {roles.length} Roles
				</div>

				<div className="overflow-x-auto rounded-2xl border border-gray-100">
					<Table className="min-w-140">
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Role
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Description
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isRolesLoading ? (
								<TableRow>
									<TableCell colSpan={2} className="h-32 text-center">
										<Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
										Loading roles...
									</TableCell>
								</TableRow>
							) : roles.length === 0 ? (
								<TableRow>
									<TableCell colSpan={2} className="h-32 text-center text-gray-500">
										No roles found.
									</TableCell>
								</TableRow>
							) : (
								roles.map((role) => (
									<TableRow key={role._id} className="border-gray-50 hover:bg-slate-50/50">
										<TableCell className="px-6 py-4 font-semibold text-gray-700 sm:px-8">
											{role.name}
										</TableCell>
										<TableCell className="px-6 py-4 text-sm text-gray-500 sm:px-8">
											{role.description || "-"}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>

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
		</div>
	);
}



export default RolesPage;
