"use client";

import React, { useMemo, useState } from "react";
import { X, Plus, Layers, Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Adress from "@/lib/api/adress";

type FilterLogic = "and" | "or";

type FilterOperator = "eq" | "contains" | "gt" | "lt" | "after" | "before";

type FilterField =
	| "fullName"
	| "age"
	| "status"
	| "city"
	| "region"
	| "zone"
	| "woreda"
	| "gender"
	| "phoneNumber";

export type FilterCondition = {
	id: string;
	field: FilterField;
	operator: FilterOperator;
	value: string;
	
	subValue?: string;
};

export type FilterGroup = {
	id: string;
	logic: FilterLogic;
	conditions: FilterCondition[];
	groups: FilterGroup[];
};

type FilterBuilderProps = {
	onFiltersChange: (filters: FilterGroup) => void;
	initialFilters?: FilterGroup;
	allApplicants?: unknown[];
	// Optional hook fired after Apply, used by the host (e.g. a modal) to close itself.
	onApply?: () => void;
};

const generateId = (): string => {
	if (typeof globalThis !== "undefined") {
		const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
		if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
	}

	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const DEFAULT_OPERATORS: FilterOperator[] = [
	"eq",
	"contains",
	"gt",
	"lt",
	"after",
	"before",
];

const DEFAULT_FIELDS: Array<{ value: FilterField; label: string }> = [
	{ value: "fullName", label: "Full Name" },
	{ value: "age", label: "Age" },
	{ value: "status", label: "Status" },
	{ value: "city", label: "City" },
	{ value: "region", label: "Region" },
	{ value: "zone", label: "Zone" },
	{ value: "woreda", label: "Woreda" },
	{ value: "gender", label: "Gender" },
	{ value: "phoneNumber", label: "Phone" },
];

const GENDER_OPTIONS: Array<{ value: string; label: string }> = [
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
];

const FilterRow = ({
	condition,
	onUpdate,
	onRemove,
}: {
	condition: FilterCondition;
	onUpdate: (updated: FilterCondition) => void;
	onRemove: () => void;
}) => {
	const isCityField = condition.field === "city";
	const isGenderField = condition.field === "gender";
	const isSelectField = isCityField || isGenderField;

	const { data: cities = [], isLoading: citiesLoading } =
		Adress.GetCities.useQuery();

	const selectedCity = useMemo(
		() => cities.find((c) => c._id === condition.value),
		[cities, condition.value],
	);
	const cityHasSubcity = Boolean(selectedCity?.hasSubcity);

	const { data: subcities = [], isLoading: subcitiesLoading } =
		Adress.GetSubCities.useQuery(
			condition.value,
			isCityField && cityHasSubcity,
		);

	const handleFieldChange = (val: string) => {
		const newField = val as FilterField;
		const nowCity = newField === "city";
		const wasCity = condition.field === "city";
		// A city `_id` is meaningless for other fields (and vice versa), so
		// reset `value` when switching in or out of the city field.
		const resetValue = nowCity !== wasCity;
		onUpdate({
			...condition,
			field: newField,
			operator: nowCity ? "eq" : condition.operator,
			value: resetValue ? "" : condition.value,
			subValue: undefined,
		});
	};

	return (
		<div className="flex items-center gap-3 p-3 bg-[#F3F8FF]/50 rounded-2xl group transition-all hover:bg-[#F3F8FF]">
			<Select value={condition.field} onValueChange={handleFieldChange}>
				<SelectTrigger className="w-40 bg-white border-none rounded-xl h-10 shadow-sm font-bold text-xs">
					<SelectValue placeholder="Field" />
				</SelectTrigger>
				<SelectContent>
					{DEFAULT_FIELDS.map((field) => (
						<SelectItem key={field.value} value={field.value}>
							{field.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{/* City and gender are always equality-matched, so the operator is implicit. */}
			{!isSelectField && (
				<Select
					value={condition.operator}
					onValueChange={(val) =>
						onUpdate({
							...condition,
							operator: val as FilterOperator,
						})
					}
				>
					<SelectTrigger className="w-32.5 bg-white border-none rounded-xl h-10 shadow-sm font-medium text-xs">
						<SelectValue placeholder="Operator" />
					</SelectTrigger>
					<SelectContent>
						{DEFAULT_OPERATORS.map((op) => (
							<SelectItem key={op} value={op}>
								{op.toUpperCase()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			<div className="flex-1 flex items-center gap-3">
				{isGenderField ? (
					<Select
						value={condition.value}
						onValueChange={(val) => onUpdate({ ...condition, value: val })}
					>
						<SelectTrigger className="flex-1 bg-white border-none rounded-xl h-10 shadow-sm text-xs">
							<SelectValue placeholder="Select gender" />
						</SelectTrigger>
						<SelectContent>
							{GENDER_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : isCityField ? (
					<>
						<Select
							value={condition.value}
							onValueChange={(val) =>
								onUpdate({ ...condition, value: val, subValue: undefined })
							}
							disabled={citiesLoading}
						>
							<SelectTrigger className="flex-1 bg-white border-none rounded-xl h-10 shadow-sm text-xs">
								<SelectValue
									placeholder={citiesLoading ? "Loading cities..." : "Select city"}
								/>
							</SelectTrigger>
							<SelectContent>
								{cities.map((c) => (
									<SelectItem key={c._id} value={c._id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{cityHasSubcity && (
							<Select
								value={condition.subValue ?? ""}
								onValueChange={(val) =>
									onUpdate({ ...condition, subValue: val })
								}
								disabled={!condition.value || subcitiesLoading}
							>
								<SelectTrigger className="flex-1 bg-white border-none rounded-xl h-10 shadow-sm text-xs">
									<SelectValue
										placeholder={
											subcitiesLoading ? "Loading subcities..." : "Select subcity"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{subcities.map((sc) => (
										<SelectItem key={sc._id} value={sc._id}>
											{sc.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</>
				) : (
					<Input
						className="bg-white border-none h-10 rounded-xl shadow-sm text-xs"
						placeholder={
							condition.field === "phoneNumber" ? "Phone number..." : "Value..."
						}
						value={condition.value}
						onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
					/>
				)}
			</div>

			<Button
				variant="ghost"
				size="icon"
				onClick={onRemove}
				className="h-8 w-8 text-gray-300 hover:text-red-500 rounded-lg"
				type="button"
			>
				<X size={14} />
			</Button>
		</div>
	);
};

const FilterGroupComponent = ({
	group,
	onUpdate,
	onRemove,
	depth = 0,
}: {
	group: FilterGroup;
	onUpdate: (updated: FilterGroup) => void;
	onRemove?: () => void;
	depth?: number;
}) => {
	const addCondition = () => {
		onUpdate({
			...group,
			conditions: [
				...group.conditions,
				{
					id: generateId(),
					field: "fullName",
					operator: "eq",
					value: "",
				},
			],
		});
	};

	const addSubGroup = () => {
		onUpdate({
			...group,
			groups: [
				...group.groups,
				{
					id: generateId(),
					logic: "and",
					conditions: [],
					groups: [],
				},
			],
		});
	};

	return (
		<div
			className={cn(
				"relative p-6 rounded-[2rem] border-2 transition-all",
				depth === 0
					? "border-blue-100 bg-white"
					: "border-slate-100 bg-slate-50/50 mt-4 ml-6",
			)}
		>
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border">
					{(["and", "or"] as const).map((logic) => (
						<button
							key={logic}
							onClick={() => onUpdate({ ...group, logic })}
							className={cn(
								"px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
								group.logic === logic
									? "bg-blue-600 text-white"
									: "text-gray-400 hover:text-gray-600",
							)}
							type="button"
						>
							{logic}
						</button>
					))}
				</div>
				{depth > 0 && onRemove && (
					<Button
						variant="ghost"
						size="icon"
						onClick={onRemove}
						className="text-gray-300 hover:text-red-500"
						type="button"
					>
						<X size={16} />
					</Button>
				)}
			</div>

			<div className="space-y-3">
				{group.conditions.map((cond) => (
					<FilterRow
						key={cond.id}
						condition={cond}
						onUpdate={(updated) =>
							onUpdate({
								...group,
								conditions: group.conditions.map((c) =>
									c.id === updated.id ? updated : c,
								),
							})
						}
						onRemove={() =>
							onUpdate({
								...group,
								conditions: group.conditions.filter((c) => c.id !== cond.id),
							})
						}
					/>
				))}
			</div>

			{group.groups.map((subGroup) => (
				<FilterGroupComponent
					key={subGroup.id}
					group={subGroup}
					depth={depth + 1}
					onUpdate={(updated) =>
						onUpdate({
							...group,
							groups: group.groups.map((g) => (g.id === updated.id ? updated : g)),
						})
					}
					onRemove={() =>
						onUpdate({
							...group,
							groups: group.groups.filter((g) => g.id !== subGroup.id),
						})
					}
				/>
			))}

			<div className="flex gap-3 mt-6">
				<Button
					onClick={addCondition}
					variant="outline"
					className="rounded-xl border-dashed border-2 border-blue-100 text-blue-500 font-bold text-xs h-9"
					type="button"
				>
					<Plus size={14} className="mr-1" /> Rule
				</Button>
				<Button
					onClick={addSubGroup}
					variant="outline"
					className="rounded-xl border-dashed border-2 border-slate-200 text-slate-400 font-bold text-xs h-9"
					type="button"
				>
					<Layers size={14} className="mr-1" /> Group
				</Button>
			</div>
		</div>
	);
};

// Seed the builder with one rule so the modal isn't an empty canvas on open
// or after reset. The user can still remove it via the row's X button.
const defaultGroup = (): FilterGroup => ({
	id: generateId(),
	logic: "and",
	conditions: [
		{ id: generateId(), field: "fullName", operator: "eq", value: "" },
	],
	groups: [],
});

export const FilterBuilder = ({
	onFiltersChange,
	initialFilters,
	onApply,
}: FilterBuilderProps) => {
	const initialRootGroup = useMemo<FilterGroup>(
		() => initialFilters ?? defaultGroup(),
		[initialFilters],
	);

	const [rootGroup, setRootGroup] = useState<FilterGroup>(initialRootGroup);

	const handleApply = () => {
		onFiltersChange(rootGroup);
		onApply?.();
	};

	const handleReset = () => {
		setRootGroup(defaultGroup());
	};

	return (
		<div className="w-full">
			<FilterGroupComponent group={rootGroup} onUpdate={setRootGroup} />

			<div className="flex items-center justify-end gap-3 mt-6">
				<Button
					type="button"
					variant="outline"
					onClick={handleReset}
					className="rounded-xl h-10 font-bold text-xs border-slate-200 text-slate-500 hover:text-slate-700"
				>
					<RotateCcw size={14} className="mr-2" />
					Reset
				</Button>
				<Button
					type="button"
					onClick={handleApply}
					className="rounded-xl h-10 font-bold text-xs bg-blue-600 text-white hover:bg-blue-700"
				>
					<Check size={14} className="mr-2" />
					Apply Filters
				</Button>
			</div>
		</div>
	);
};

