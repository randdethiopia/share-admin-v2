"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Layers } from "lucide-react";

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

type FilterLogic = "and" | "or";

type FilterOperator = "eq" | "contains" | "gt" | "lt" | "after" | "before";

type FilterField = "fullName" | "age" | "status";

export type FilterCondition = {
	id: string;
	field: FilterField;
	operator: FilterOperator;
	value: string;
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
];

// --- 1. ATOM: THE FILTER ROW (A single leaf) ---
const FilterRow = ({
	condition,
	onUpdate,
	onRemove,
}: {
	condition: FilterCondition;
	onUpdate: (updated: FilterCondition) => void;
	onRemove: () => void;
}) => {
	return (
		<div className="flex items-center gap-3 p-3 bg-[#F3F8FF]/50 rounded-2xl group transition-all hover:bg-[#F3F8FF]">
			{/* Field Selector */}
			<Select
				value={condition.field}
				onValueChange={(val) =>
					onUpdate({
						...condition,
						field: val as FilterField,
					})
				}
			>
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

			{/* Operator Selector */}
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

			{/* Value Input */}
			<div className="flex-1">
				<Input
					className="bg-white border-none h-10 rounded-xl shadow-sm text-xs"
					placeholder="Value..."
					value={condition.value}
					onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
				/>
			</div>

			{/* Remove Button */}
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

// --- 2. BRANCH: THE GROUP COMPONENT (Recursive) ---
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
			{/* Logic Toggle (AND/OR) */}
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

			{/* Render Child Conditions (Leaves) */}
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

			{/* Render Child Groups (Branches) - RECURSION HAPPENS HERE */}
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

			{/* Add Controls */}
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

// --- 3. ROOT: THE FILTER BUILDER ---
export const FilterBuilder = ({
	onFiltersChange,
	initialFilters,
}: FilterBuilderProps) => {
	const initialRootGroup = useMemo<FilterGroup>(() => {
		return (
			initialFilters ?? {
				id: generateId(),
				logic: "and",
				conditions: [],
				groups: [],
			}
		);
	}, [initialFilters]);

	const [rootGroup, setRootGroup] = useState<FilterGroup>(initialRootGroup);

	const onFiltersChangeRef = useRef(onFiltersChange);
	useEffect(() => {
		onFiltersChangeRef.current = onFiltersChange;
	}, [onFiltersChange]);

	useEffect(() => {
		onFiltersChangeRef.current(rootGroup);
	}, [rootGroup]);

	return (
		<div className="w-full">
			<FilterGroupComponent group={rootGroup} onUpdate={setRootGroup} />
		</div>
	);
};

