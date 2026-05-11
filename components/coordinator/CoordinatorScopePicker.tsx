"use client";

import type { CoordinatorType } from "@/lib/api/coordinator";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

function resolveCoordinatorLabel(coordinator: CoordinatorType) {
	const fullName =
		`${coordinator.firstName || ""} ${coordinator.lastName || ""}`.trim();
	return fullName || coordinator.email || coordinator._id;
}

export function CoordinatorScopePicker({
	coordinators,
	value,
	onValueChange,
	disabled,
	isLoading,
	isError,
	id = "admin-coordinator-scope",
}: {
	coordinators: CoordinatorType[];
	value: string;
	onValueChange: (id: string) => void;
	disabled?: boolean;
	isLoading: boolean;
	isError: boolean;
	id?: string;
}) {
	return (
		<div className="space-y-2">
			<Label
				htmlFor={id}
				className="text-xs font-semibold uppercase tracking-wide text-slate-600"
			>
				Coordinator context
			</Label>
			<Select
				value={value}
				onValueChange={onValueChange}
				disabled={disabled || isLoading || isError}
			>
				<SelectTrigger id={id} className="h-11 max-w-md rounded-xl">
					<SelectValue
						placeholder={
							isLoading
								? "Loading coordinators…"
								: isError
									? "Failed to load coordinators"
									: "Select a coordinator"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{coordinators.length === 0 ? (
						<div className="px-2 py-2 text-sm text-slate-500">
							{isLoading ? (
								<span className="inline-flex items-center gap-2">
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									Loading…
								</span>
							) : isError ? (
								"Could not load coordinators."
							) : (
								"No coordinators found."
							)}
						</div>
					) : (
						coordinators.map((c) => (
							<SelectItem key={c._id} value={c._id}>
								{resolveCoordinatorLabel(c)}
							</SelectItem>
						))
					)}
				</SelectContent>
			</Select>
			<p className="text-xs text-slate-500">
				As admin, choose which coordinator
			</p>
		</div>
	);
}
