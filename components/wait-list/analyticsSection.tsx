"use client";

import * as React from "react";
import {
	BarChart3,
	Calendar,
	Check,
	Download,
	FileSpreadsheet,
	Laptop,
	LayoutList,
	Minus,
	TableIcon,
	TrendingUp,
	Users,
	X,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { AVAILABLE_FIELDS, type AvailableField } from "./constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WaitlistAnalytics = {
	total: number;
	unemployed: number;
	avgAge: number;
	computerAccessPercentage: number;
};

export type ReportFormat = "table" | "summary";

export type AnalyticsSectionProps = {
	analytics?: Partial<WaitlistAnalytics> | null;
	customReportOpen: boolean;
	setCustomReportOpen: (open: boolean) => void;
	exportToCSV: () => void;
	reportFormat: ReportFormat;
	setReportFormat: (value: ReportFormat) => void;
	selectedFields: string[];
	setSelectedFields: (value: string[]) => void;
	filteredMessages?: unknown[] | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function asString(v: unknown): string {
	if (v === null || v === undefined) return "—";
	if (typeof v === "boolean") return v ? "Yes" : "No";
	if (Array.isArray(v)) return v.join(", ") || "—";
	return String(v) || "—";
}

// Soft pastel dot colors for each category (no bright text labels)
const CATEGORY_DOT: Record<string, string> = {
	Personal:   "bg-violet-400",
	Employment: "bg-amber-400",
	Technical:  "bg-sky-400",
	Education:  "bg-emerald-400",
	Location:   "bg-rose-400",
	Program:    "bg-indigo-400",
	Other:      "bg-orange-400",
	Meta:       "bg-slate-400",
};

// ─── Custom Dialog (no Radix Dialog, to avoid double-close button) ────────────

function Modal({
	open,
	onClose,
	children,
}: {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
}) {
	// Lock scroll when open
	React.useEffect(() => {
		if (open) document.body.style.overflow = "hidden";
		else document.body.style.overflow = "";
		return () => { document.body.style.overflow = ""; };
	}, [open]);

	// Close on backdrop click
	const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) onClose();
	};

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
			style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
			onClick={onBackdrop}
		>
			{children}
		</div>
	);
}

// ─── Field Selector (left panel) ─────────────────────────────────────────────

function FieldSelector({
	orderedCategories,
	groupedFields,
	selectedFields,
	setSelectedFields,
	allKeys,
}: {
	orderedCategories: string[];
	groupedFields: Record<string, AvailableField[]>;
	selectedFields: string[];
	setSelectedFields: (v: string[]) => void;
	allKeys: string[];
}) {
	const selectedSet = new Set(selectedFields);
	const allSelected = selectedFields.length === allKeys.length;
	const someSelected = selectedFields.length > 0;

	const toggleAll = () => {
		setSelectedFields(allSelected ? [] : [...allKeys]);
	};

	const toggleCategory = (category: string) => {
		const keys = (groupedFields[category] ?? []).map((f) => f.key);
		const allIn = keys.every((k) => selectedSet.has(k));
		if (allIn) {
			setSelectedFields(selectedFields.filter((f) => !keys.includes(f)));
		} else {
			const next = new Set(selectedFields);
			keys.forEach((k) => next.add(k));
			setSelectedFields([...next]);
		}
	};

	const toggleField = (key: string, checked: boolean) => {
		setSelectedFields(
			checked ? [...selectedFields, key] : selectedFields.filter((f) => f !== key)
		);
	};

	return (
		<div className="flex flex-col h-full">
			{/* Panel header */}
			<div className="px-5 pt-5 pb-4">
				<div className="flex items-center justify-between mb-3">
					<span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
						Fields
					</span>
					<span className="text-[11px] font-semibold text-slate-500 tabular-nums">
						{selectedFields.length}
						<span className="text-slate-300">/{allKeys.length}</span>
					</span>
				</div>

				{/* Progress bar */}
				<div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden mb-4">
					<div
						className="h-full rounded-full bg-blue-500 transition-all duration-300"
						style={{ width: `${allKeys.length ? (selectedFields.length / allKeys.length) * 100 : 0}%` }}
					/>
				</div>

				{/* Select / Deselect All */}
				<button
					type="button"
					onClick={toggleAll}
					className={cn(
						"w-full rounded-lg border text-xs font-semibold py-2 px-3 flex items-center gap-2 transition-all duration-150",
						allSelected
							? "border-blue-200 bg-blue-50 text-blue-600"
							: someSelected
							? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
							: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
					)}
				>
					<span
						className={cn(
							"w-4 h-4 rounded flex items-center justify-center border shrink-0",
							allSelected
								? "bg-blue-500 border-blue-500 text-white"
								: someSelected
								? "bg-blue-100 border-blue-300 text-blue-600"
								: "border-slate-300 bg-white"
						)}
					>
						{allSelected ? (
							<Check className="h-2.5 w-2.5" />
						) : someSelected ? (
							<Minus className="h-2.5 w-2.5" />
						) : null}
					</span>
					{allSelected ? "Deselect All" : "Select All"}
				</button>
			</div>

			<div className="border-t border-slate-100 mx-5" />

			{/* Category list */}
			<ScrollArea className="flex-1">
				<div className="px-5 py-4 space-y-5">
					{orderedCategories.map((category) => {
						const fields = groupedFields[category] ?? [];
						const catKeys = fields.map((f) => f.key);
						const catChecked = catKeys.filter((k) => selectedSet.has(k)).length;
						const catAll = catChecked === catKeys.length && catKeys.length > 0;
						const catSome = catChecked > 0 && !catAll;
						const dot = CATEGORY_DOT[category] ?? "bg-slate-400";

						return (
							<div key={category}>
								{/* Category row */}
								<button
									type="button"
									onClick={() => toggleCategory(category)}
									className="w-full flex items-center gap-2 mb-2 group"
								>
									<span
										className={cn(
											"w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors",
											catAll
												? "bg-blue-500 border-blue-500 text-white"
												: catSome
												? "bg-blue-100 border-blue-300 text-blue-600"
												: "border-slate-300 bg-white group-hover:border-slate-400"
										)}
									>
										{catAll ? (
											<Check className="h-2.5 w-2.5" />
										) : catSome ? (
											<Minus className="h-2.5 w-2.5" />
										) : null}
									</span>
									<span className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
									<span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
										{category}
									</span>
									<span className="ml-auto text-[10px] text-slate-400 tabular-nums">
										{catChecked}/{catKeys.length}
									</span>
								</button>

								{/* Field checkboxes */}
								<div className="pl-6 space-y-0.5">
									{fields.map((field) => {
										const checked = selectedSet.has(field.key);
										return (
											<label
												key={field.key}
												htmlFor={`f-${field.key}`}
												className={cn(
													"flex items-center gap-2.5 cursor-pointer rounded-md px-2 py-1.5 transition-colors select-none group/item",
													checked ? "bg-blue-50" : "hover:bg-slate-50"
												)}
											>
												<Checkbox
													id={`f-${field.key}`}
													checked={checked}
													onCheckedChange={(c) => toggleField(field.key, Boolean(c))}
													className="h-3.5 w-3.5 shrink-0"
												/>
												<span
													className={cn(
														"text-xs leading-none",
														checked ? "text-blue-700 font-medium" : "text-slate-600"
													)}
												>
													{field.label}
												</span>
											</label>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>
		</div>
	);
}

// ─── Preview Panel (right panel) ─────────────────────────────────────────────

function PreviewPanel({
	reportFormat,
	setReportFormat,
	selectedFields,
	previewRows,
	totalRows,
	fieldLabelByKey,
}: {
	reportFormat: ReportFormat;
	setReportFormat: (v: ReportFormat) => void;
	selectedFields: string[];
	previewRows: unknown[];
	totalRows: number;
	fieldLabelByKey: Record<string, string>;
}) {
	const summaryStats = React.useMemo(() => {
		if (reportFormat !== "summary" || !previewRows.length || !selectedFields.length) return null;
		return selectedFields.map((key) => {
			const vals = previewRows.map(
				(r) => (r && typeof r === "object" ? (r as Record<string, unknown>)[key] : undefined)
			);
			const filled = vals.filter((v) => v !== null && v !== undefined && v !== "").length;
			const rate = Math.round((filled / vals.length) * 100);
			return { key, label: fieldLabelByKey[key] ?? key, filled, empty: vals.length - filled, rate };
		});
	}, [reportFormat, previewRows, selectedFields, fieldLabelByKey]);

	return (
		<div className="flex flex-col h-full">
			{/* Right panel header */}
			<div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0">
				<div>
					<p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
						Preview
					</p>
					{selectedFields.length > 0 && previewRows.length > 0 && (
						<p className="text-[11px] text-slate-400 mt-0.5">
							First {Math.min(5, previewRows.length)} of {totalRows.toLocaleString()} rows
						</p>
					)}
				</div>

				{/* Toggle */}
				<div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
					{(["table", "summary"] as const).map((mode) => (
						<button
							key={mode}
							type="button"
							onClick={() => setReportFormat(mode)}
							className={cn(
								"flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
								reportFormat === mode
									? "bg-white text-slate-800 shadow-sm"
									: "text-slate-500 hover:text-slate-700"
							)}
						>
							{mode === "table" ? (
								<TableIcon className="h-3.5 w-3.5" />
							) : (
								<LayoutList className="h-3.5 w-3.5" />
							)}
							{mode === "table" ? "Table" : "Summary"}
						</button>
					))}
				</div>
			</div>

			<div className="border-t border-slate-100 mx-6 shrink-0" />

			{/* Content */}
			<div className="flex-1 min-h-0 overflow-hidden">
				{selectedFields.length === 0 ? (
					<EmptyState
						icon={<FileSpreadsheet className="h-10 w-10 text-slate-200" />}
						title="No fields selected"
						hint="Select fields from the panel on the left to preview your report."
					/>
				) : previewRows.length === 0 ? (
					<EmptyState
						icon={<FileSpreadsheet className="h-10 w-10 text-slate-200" />}
						title="No data available"
						hint="There are no applicants matching the current filters."
					/>
				) : reportFormat === "table" ? (
					<TableView rows={previewRows} fields={selectedFields} labels={fieldLabelByKey} />
				) : (
					<SummaryView stats={summaryStats ?? []} />
				)}
			</div>
		</div>
	);
}

function EmptyState({
	icon,
	title,
	hint,
}: {
	icon: React.ReactNode;
	title: string;
	hint: string;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
			{icon}
			<div>
				<p className="text-sm font-medium text-slate-600">{title}</p>
				<p className="mt-1 text-xs text-slate-400 leading-relaxed">{hint}</p>
			</div>
		</div>
	);
}

function TableView({
	rows,
	fields,
	labels,
}: {
	rows: unknown[];
	fields: string[];
	labels: Record<string, string>;
}) {
	return (
		<ScrollArea className="h-full w-full">
			<div className="overflow-auto">
				<table className="w-full text-xs text-left">
					<thead>
						<tr className="bg-slate-50 border-b border-slate-100">
							{fields.map((key) => (
								<th
									key={key}
									className="px-4 py-3 font-semibold text-slate-500 whitespace-nowrap text-[11px] uppercase tracking-wide"
								>
									{labels[key] ?? key}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.slice(0, 5).map((row, i) => {
							const rec =
								row && typeof row === "object"
									? (row as Record<string, unknown>)
									: ({} as Record<string, unknown>);
							return (
								<tr
									key={i}
									className={cn(
										"border-b border-slate-50 last:border-0",
										i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
									)}
								>
									{fields.map((key) => (
										<td
											key={key}
											className="px-4 py-3 text-slate-600 whitespace-nowrap max-w-[200px] truncate"
											title={asString(rec[key])}
										>
											{asString(rec[key])}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</ScrollArea>
	);
}

function SummaryView({
	stats,
}: {
	stats: { key: string; label: string; filled: number; empty: number; rate: number }[];
}) {
	if (!stats.length) {
		return (
			<EmptyState
				icon={<LayoutList className="h-10 w-10 text-slate-200" />}
				title="Nothing to summarise"
				hint="Select at least one field."
			/>
		);
	}
	return (
		<ScrollArea className="h-full">
			<div className="px-6 py-5 space-y-2">
				{stats.map((s) => (
					<div
						key={s.key}
						className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3"
					>
						<p className="text-xs font-medium text-slate-700 min-w-[140px] truncate">{s.label}</p>
						<div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
							<div
								className={cn(
									"h-full rounded-full transition-all",
									s.rate >= 80 ? "bg-emerald-400" : s.rate >= 50 ? "bg-amber-400" : "bg-rose-400"
								)}
								style={{ width: `${s.rate}%` }}
							/>
						</div>
						<span
							className={cn(
								"text-xs font-bold tabular-nums w-9 text-right shrink-0",
								s.rate >= 80 ? "text-emerald-600" : s.rate >= 50 ? "text-amber-600" : "text-rose-500"
							)}
						>
							{s.rate}%
						</span>
						<span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">
							{s.filled} filled
						</span>
					</div>
				))}
			</div>
		</ScrollArea>
	);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function AnalyticsSection({
	analytics,
	customReportOpen,
	setCustomReportOpen,
	exportToCSV,
	reportFormat,
	setReportFormat,
	selectedFields,
	setSelectedFields,
	filteredMessages,
}: AnalyticsSectionProps) {
	const categoryOrder = React.useMemo(
		() => ["Personal", "Employment", "Technical", "Other", "Education", "Location", "Program", "Meta"],
		[]
	);

	const groupedFields = React.useMemo(() => {
		return AVAILABLE_FIELDS.reduce<Record<string, AvailableField[]>>((acc, f) => {
			(acc[f.category] ??= []).push(f);
			return acc;
		}, {});
	}, []);

	const orderedCategories = React.useMemo(() => {
		const existing = new Set(Object.keys(groupedFields));
		return [
			...categoryOrder.filter((c) => existing.has(c)),
			...Object.keys(groupedFields).filter((c) => !categoryOrder.includes(c)),
		];
	}, [groupedFields, categoryOrder]);

	const allKeys = React.useMemo(() => AVAILABLE_FIELDS.map((f) => f.key), []);

	const fieldLabelByKey = React.useMemo(
		() => AVAILABLE_FIELDS.reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.key]: f.label }), {}),
		[]
	);

	const previewRows = React.useMemo(
		() => (Array.isArray(filteredMessages) ? filteredMessages.slice(0, 5) : []),
		[filteredMessages]
	);

	const totalRows = Array.isArray(filteredMessages) ? filteredMessages.length : 0;

	const safeAnalytics: WaitlistAnalytics = {
		total: Number(analytics?.total ?? 0),
		unemployed: Number(analytics?.unemployed ?? 0),
		avgAge: Number(analytics?.avgAge ?? 0),
		computerAccessPercentage: Number(analytics?.computerAccessPercentage ?? 0),
	};

	const handleExportAndClose = () => {
		exportToCSV();
		setCustomReportOpen(false);
	};

	return (
		<div className="space-y-8">
			{/* Title + Actions */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
				<div className="space-y-0.5">
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Waitlist Dashboard</h1>
					<p className="text-sm text-muted-foreground">Analytics Overview</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCustomReportOpen(true)}
						className="bg-white hover:bg-slate-50 gap-1.5"
					>
						<BarChart3 className="h-4 w-4" />
						Custom Report
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={exportToCSV}
						className="bg-white hover:bg-slate-50 gap-1.5"
					>
						<Download className="h-4 w-4" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* Report Builder Modal */}
			<Modal open={customReportOpen} onClose={() => setCustomReportOpen(false)}>
				<div
					className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
					style={{
						height: "min(720px, calc(100vh - 80px))",
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* ── Modal Header ── */}
					<div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
							<BarChart3 className="h-4 w-4 text-white" />
						</div>
						<div>
							<h2 className="text-sm font-bold text-slate-800 leading-tight">
								Custom Report Builder
							</h2>
							<p className="text-[11px] text-slate-400 leading-tight mt-0.5">
								Select fields · choose format · export as CSV
							</p>
						</div>
						<button
							type="button"
							onClick={() => setCustomReportOpen(false)}
							className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
							aria-label="Close"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* ── Two-Panel Body ── */}
					<div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">
						{/* LEFT — Field selector */}
						<div
							className="border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/60 flex flex-col overflow-hidden shrink-0 w-full lg:w-72 max-h-64 lg:max-h-none"
						>
							<FieldSelector
								orderedCategories={orderedCategories}
								groupedFields={groupedFields}
								selectedFields={selectedFields}
								setSelectedFields={setSelectedFields}
								allKeys={allKeys}
							/>
						</div>

						{/* RIGHT — Preview */}
						<div className="flex-1 flex flex-col overflow-hidden">
							<PreviewPanel
								reportFormat={reportFormat}
								setReportFormat={setReportFormat}
								selectedFields={selectedFields}
								previewRows={previewRows}
								totalRows={totalRows}
								fieldLabelByKey={fieldLabelByKey}
							/>
						</div>
					</div>

					{/* ── Modal Footer ── */}
					<div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white shrink-0">
						<p className="text-[11px] text-slate-400">
							{selectedFields.length > 0 ? (
								<>
									<span className="font-semibold text-slate-600">{selectedFields.length}</span>
									{" fields · "}
									<span className="font-semibold text-slate-600">
										{totalRows.toLocaleString()}
									</span>
									{" rows"}
								</>
							) : (
								"No fields selected"
							)}
						</p>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setCustomReportOpen(false)}
								className="text-slate-500 hover:text-slate-700 text-xs"
							>
								Cancel
							</Button>
							<Button
								size="sm"
								disabled={selectedFields.length === 0}
								onClick={handleExportAndClose}
								className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 disabled:opacity-40"
							>
								<Download className="h-3.5 w-3.5" />
								Export CSV
							</Button>
						</div>
					</div>
				</div>
			</Modal>

			{/* Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard title="Total Applicants" value={safeAnalytics.total} icon={Users} />
				<StatCard title="Unemployed" value={safeAnalytics.unemployed} icon={TrendingUp} />
				<StatCard title="Avg Age" value={safeAnalytics.avgAge} icon={Calendar} />
				<StatCard
					title="Computer Access"
					value={`${safeAnalytics.computerAccessPercentage}%`}
					icon={Laptop}
				/>
			</div>
		</div>
	);
}
