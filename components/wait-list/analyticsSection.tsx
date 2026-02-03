"use client";

import * as React from "react";
import { BarChart3, Calendar, Download, Laptop, TrendingUp, Users } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { AVAILABLE_FIELDS, type AvailableField } from "./constants";

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
		() => [
			"Personal",
			"Employment",
			"Technical",
			"Other",
			"Education",
			"Location",
			"Program",
			"Meta",
		],
		[]
	);

	const groupedFields = React.useMemo(() => {
		return AVAILABLE_FIELDS.reduce<Record<string, AvailableField[]>>((acc, field) => {
			(acc[field.category] ??= []).push(field);
			return acc;
		}, {});
	}, []);

	const orderedCategories = React.useMemo(() => {
		const existing = new Set(Object.keys(groupedFields));
		const ordered = categoryOrder.filter((c) => existing.has(c));
		const rest = Object.keys(groupedFields).filter((c) => !categoryOrder.includes(c));
		return [...ordered, ...rest];
	}, [groupedFields, categoryOrder]);

	const fieldLabelByKey = React.useMemo(() => {
		return AVAILABLE_FIELDS.reduce<Record<string, string>>((acc, field) => {
			acc[field.key] = field.label;
			return acc;
		}, {});
	}, []);

	const previewRows = React.useMemo(() => {
		return Array.isArray(filteredMessages) ? filteredMessages.slice(0, 5) : [];
	}, [filteredMessages]);

	const safeAnalytics: WaitlistAnalytics = {
		total: Number(analytics?.total ?? 0),
		unemployed: Number(analytics?.unemployed ?? 0),
		avgAge: Number(analytics?.avgAge ?? 0),
		computerAccessPercentage: Number(analytics?.computerAccessPercentage ?? 0),
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
				<div className="space-y-1">
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						Waitlist Dashboard
					</h1>
					<p className="text-sm text-muted-foreground">Analytics Overview</p>
				</div>

				<div className="flex items-center gap-2">
					<Dialog open={customReportOpen} onOpenChange={setCustomReportOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm" className="bg-white">
								<BarChart3 className="h-4 w-4" />
								Custom Report
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-5xl w-[calc(100vw-2rem)] sm:w-full p-0 max-h-[90vh] overflow-hidden">
							<div className="p-5 sm:p-8 overflow-y-auto max-h-[90vh]">
								<DialogHeader className="space-y-1">
									<DialogTitle className="text-lg sm:text-xl font-bold">
										Custom Report
									</DialogTitle>
									<DialogDescription className="text-sm text-muted-foreground">
										Choose fields and a format. Preview updates automatically.
									</DialogDescription>
								</DialogHeader>

								<div className="mt-6 grid gap-6 lg:grid-cols-5">
									{/* Right pane first on mobile: format + preview */}
									<div className="order-1 lg:order-2 lg:col-span-3 space-y-4">
										<div className="space-y-2">
											<Label className="text-sm font-semibold">Report Format</Label>
											<Select
												value={reportFormat}
												onValueChange={(v) => setReportFormat(v as ReportFormat)}
											>
												<SelectTrigger className="h-10 rounded-xl bg-white">
													<SelectValue placeholder="Select format" />
												</SelectTrigger>
												<SelectContent className="rounded-xl">
													<SelectItem value="table">Table View</SelectItem>
													<SelectItem value="summary">Summary Statistics</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="rounded-2xl border bg-white overflow-hidden">
											<div className="flex items-center justify-between border-b p-4">
												<p className="text-sm font-semibold">Preview</p>
												<p className="text-xs text-muted-foreground">First 5 rows</p>
											</div>
											{reportFormat !== "table" ? (
												<div className="p-6 text-sm text-muted-foreground">
													Switch to “Table View” to see a preview.
												</div>
											) : selectedFields.length === 0 ? (
												<div className="p-6 text-sm text-muted-foreground">
													Select at least one field.
												</div>
											) : previewRows.length === 0 ? (
												<div className="p-6 text-sm text-muted-foreground">
													No rows to preview.
												</div>
											) : (
												<div className="overflow-auto max-h-64 sm:max-h-80 lg:max-h-96">
													<table className="w-full text-left text-xs">
														<thead className="bg-muted/40 border-b sticky top-0">
															<tr>
																{selectedFields.map((fieldKey) => (
																	<th
																		key={fieldKey}
																		className="px-4 py-3 font-semibold text-foreground/80 whitespace-nowrap"
																	>
																		{fieldLabelByKey[fieldKey] ?? fieldKey}
																	</th>
																))}
															</tr>
														</thead>
														<tbody>
															{previewRows.map((row, idx) => {
																const record =
																	row && typeof row === "object"
																		? (row as Record<string, unknown>)
																		: ({} as Record<string, unknown>);
																return (
																	<tr key={idx} className="border-b last:border-0">
																		{selectedFields.map((fieldKey) => (
																			<td
																				key={fieldKey}
																				className="px-4 py-3 text-muted-foreground whitespace-nowrap"
																			>
																				{String(record[fieldKey] ?? "-")}
																			</td>
																		))}
																	</tr>
																);
															})}
														</tbody>
													</table>
												</div>
											)}
										</div>
									</div>

									{/* Left pane: fields selector */}
									<div className="order-2 lg:order-1 lg:col-span-2 space-y-2">
										<Label className="text-sm font-semibold">Fields</Label>
										<div className="rounded-2xl border bg-muted/30 p-4 max-h-64 sm:max-h-80 lg:max-h-96 overflow-auto">
											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
													{orderedCategories.map((category) => (
														<div key={category} className="space-y-2">
															<p className="text-xs font-semibold text-muted-foreground">
																{category}
															</p>
															<div className="space-y-2">
																{(groupedFields[category] ?? []).map((field) => {
																	const isChecked = selectedFields.includes(field.key);
																	return (
																		<div key={field.key} className="flex items-center gap-2">
																			<Checkbox
																				id={field.key}
																				checked={isChecked}
																				onCheckedChange={(checked) => {
																					const nextChecked = Boolean(checked);
																					if (nextChecked && !isChecked) {
																						setSelectedFields([
																						...selectedFields,
																						field.key,
																					]);
																					return;
																					}
																					if (!nextChecked && isChecked) {
																						setSelectedFields(
																							selectedFields.filter((f) => f !== field.key)
																						);
																					}
																				}}
																		/>
																			<Label
																				htmlFor={field.key}
																				className="text-xs font-medium text-foreground/80 cursor-pointer"
																			>
																				{field.label}
																			</Label>
																		</div>
																	);
																})}
															</div>
														</div>
													))}
												</div>
											</div>
										</div>
									</div>
							</div>

							<div className="mt-6 flex justify-end">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCustomReportOpen(false)}
								>
									Close
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					<Button onClick={exportToCSV} variant="outline" size="sm" className="bg-white">
						<Download className="h-4 w-4" /> Export CSV
					</Button>
				</div>
			</div>

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

