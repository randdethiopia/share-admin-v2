"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
	Briefcase,
	Calendar,
	DollarSign,
	Globe,
	GraduationCap,
	Inbox,
	Laptop,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Trash2,
	User,
	UserPlus,
} from "lucide-react";

import WaitListApi, { type WaitListType } from "@/api/waitlist";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DetailRowProps = {
	icon: LucideIcon;
	label: string;
	value?: React.ReactNode;
};

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
	if (value === null || value === undefined || value === "") return null;
	return (
		<div className="flex items-start gap-4 py-4 border-b border-slate-100 last:border-0 group">
			<div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
				<Icon size={16} />
			</div>
			<div className="space-y-1">
				<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
					{label}
				</p>
				<div className="text-sm font-semibold text-slate-700 wrap-break-word">
					{value}
				</div>
			</div>
		</div>
	);
}

function defaultGetInitials(name: string) {
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (parts.length === 0) return "?";
	return parts
		.slice(0, 2)
		.map((p) => p[0] ?? "")
		.join("")
		.toUpperCase();
}

function defaultGetStatusColor(status: string) {
	const s = status.trim().toLowerCase();
	if (!s) return "bg-slate-100 text-slate-700";
	if (s.includes("unemployed")) return "bg-rose-50 text-rose-700";
	if (s.includes("employed")) return "bg-emerald-50 text-emerald-700";
	if (s.includes("student")) return "bg-sky-50 text-sky-700";
	return "bg-slate-100 text-slate-700";
}

function titleCase(value: string) {
	return value
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(" ");
}

function getEligibilityLabel(applicant: WaitListType): string | null {
	const obj = applicant as unknown as Record<string, unknown>;
	const keys = ["eligible", "isEligible", "eligibility", "eligibilityStatus"] as const;
	for (const key of keys) {
		const value = obj[key];
		if (value === null || value === undefined || value === "") continue;
		if (typeof value === "boolean") return value ? "Eligible" : "Not eligible";
		return String(value);
	}
	return null;
}

export type ApplicantDetailProps = {
	selectedMessage: WaitListType | null;
	getInitials?: (name: string) => string;
	getStatusColor?: (status: string) => string;
	deleteMessage?: (id: string) => void;
};

export function ApplicantDetail({
	selectedMessage,
	getInitials = defaultGetInitials,
	getStatusColor = defaultGetStatusColor,
	deleteMessage,
}: ApplicantDetailProps) {
	const { mutate: createAccount, isPending: isCreating } =
		WaitListApi.CreateTraineeByWaitlistId.useMutation();
	const { mutate: deleteApplicant, isPending: isDeleting } =
		WaitListApi.Delete.useMutation();

	const onDelete = React.useCallback(
		(id: string) => {
			if (typeof window === "undefined") return;
			if (!window.confirm("Delete permanently?")) return;
			if (deleteMessage) {
				deleteMessage(id);
				return;
			}
			deleteApplicant(id);
		},
		[deleteMessage, deleteApplicant]
	);

	if (!selectedMessage) {
		return (
			<div className="hidden md:flex flex-1 items-center justify-center bg-white rounded-3xl m-4 border-2 border-dashed border-slate-200">
				<div className="text-center space-y-4">
					<div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-200">
						<Inbox size={40} />
					</div>
					<p className="text-slate-400 font-semibold">
						Select an applicant to view details
					</p>
				</div>
			</div>
		);
	}

	const fullName = (selectedMessage.fullName ?? "").toString();
	const email = (selectedMessage.email ?? "").toString();
	const phoneNumber = (selectedMessage.phoneNumber ?? "").toString();
	const currentEmploymentStatus =
		(selectedMessage.currentEmploymentStatus ?? "").toString();
	const educationLevel = (selectedMessage.educationLevel ?? "").toString();
	const sex = (selectedMessage.sex ?? "").toString();
	const age = selectedMessage.age;
	const stage = (selectedMessage.stage ?? "").toString();
	const eligibilityLabel = getEligibilityLabel(selectedMessage);

	return (
		<div className="hidden md:flex flex-1 flex-col bg-white rounded-3xl m-4 shadow-sm overflow-hidden border border-slate-100">
			{/* Header */}
			<div className="p-10 pb-6 border-b border-slate-100">
				<div className="flex justify-between items-start gap-6">
					<div className="flex gap-6 items-center min-w-0">
						<Avatar className="h-20 w-20 border-4 border-slate-50 shadow-sm">
							<AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
								{getInitials(fullName)}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-2 min-w-0">
							<h2 className="text-xl font-black text-slate-700 tracking-tight truncate">
								{fullName || "—"}
							</h2>
							<div className="flex gap-2 flex-wrap">
								<Badge
									className={cn(
										"rounded-full px-3 font-bold text-[10px] uppercase",
										getStatusColor(currentEmploymentStatus)
									)}
								>
									{currentEmploymentStatus || "—"}
								</Badge>
								<Badge
									variant="outline"
									className="rounded-full border-slate-200 text-slate-500 font-bold text-[10px] uppercase"
								>
									{selectedMessage.batch || "N/A"}
								</Badge>
								{educationLevel ? (
									<Badge
										variant="outline"
										className="rounded-full border-slate-200 text-slate-500 font-bold text-[10px] uppercase"
									>
										{educationLevel}
									</Badge>
								) : null}
								{typeof age === "number" && Number.isFinite(age) ? (
									<Badge
										variant="outline"
										className="rounded-full border-slate-200 text-slate-500 font-bold text-[10px] uppercase"
									>
										{age} YRS
									</Badge>
								) : null}
								{sex ? (
									<Badge
										variant="outline"
										className="rounded-full border-slate-200 text-slate-500 font-bold text-[10px] uppercase"
									>
										{titleCase(sex)}
									</Badge>
								) : null}
								{eligibilityLabel ? (
									<Badge
										className={cn(
											"rounded-full px-3 font-bold text-[10px] uppercase",
											eligibilityLabel.toLowerCase().includes("not")
												? "bg-rose-50 text-rose-700"
												: "bg-emerald-50 text-emerald-700"
										)}
									>
										{eligibilityLabel}
									</Badge>
								) : null}
							</div>
						</div>
					</div>

					<div className="flex gap-3">
						<Button
							onClick={() => createAccount(selectedMessage._id)}
							disabled={isCreating}
							className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-6 font-bold shadow-md"
						>
							{isCreating ? (
								<Loader2 className="animate-spin" />
							) : (
								<UserPlus size={16} className="mr-2" />
							)}
							Create Account
						</Button>
						<Button
							onClick={() => onDelete(selectedMessage._id)}
							disabled={isDeleting}
							variant="ghost"
							className="text-rose-600 hover:bg-rose-50 rounded-xl h-10 w-10 p-0"
							title="Delete applicant"
						>
							{isDeleting ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Trash2 size={20} />
							)}
						</Button>
					</div>
				</div>

				<div className="flex gap-8 mt-10 text-sm text-slate-500 font-semibold flex-wrap">
					<div className="flex items-center gap-2">
						<Mail size={14} /> {email || "—"}
					</div>
					<div className="flex items-center gap-2">
						<Phone size={14} /> {phoneNumber || "—"}
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex-1 overflow-y-auto p-10 pt-6">
				<Tabs defaultValue="personal" className="w-full">
					<TabsList className="bg-slate-50 p-1 rounded-2xl mb-8">
						<TabsTrigger
							value="personal"
							className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
						>
							Personal
						</TabsTrigger>
						<TabsTrigger
							value="education"
							className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
						>
							Education
						</TabsTrigger>
						<TabsTrigger
							value="employment"
							className="rounded-xl px-8 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm"
						>
							Employment
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="personal"
						className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 mt-0"
					>
						<div className="space-y-1">
							<DetailRow icon={User} label="Full Name" value={fullName} />
							<DetailRow
								icon={Calendar}
								label="Age"
								value={
									selectedMessage.age
										? `${selectedMessage.age} Years Old`
										: "—"
								}
							/>
							<DetailRow icon={Globe} label="Gender" value={selectedMessage.sex} />
							<DetailRow
								icon={User}
								label="Marital Status"
								value={selectedMessage.maritalStatus}
							/>
						</div>
						<div className="space-y-1">
							<DetailRow icon={MapPin} label="Region" value={selectedMessage.region} />
							<DetailRow icon={MapPin} label="Subcity" value={selectedMessage.subcity} />
							<DetailRow icon={MapPin} label="Zone" value={selectedMessage.zone} />
							<DetailRow icon={MapPin} label="Woreda" value={selectedMessage.woreda} />
						</div>
					</TabsContent>

					<TabsContent value="education" className="space-y-2 mt-0">
						<DetailRow
							icon={GraduationCap}
							label="Education Level"
							value={selectedMessage.educationLevel}
						/>
						<DetailRow
							icon={Briefcase}
							label="Field of Study"
							value={selectedMessage.studySubject}
						/>
						<DetailRow
							icon={Laptop}
							label="Computer Skills"
							value={selectedMessage.computerSkill}
						/>
					</TabsContent>

					<TabsContent value="employment" className="space-y-2 mt-0">
						<DetailRow
							icon={Briefcase}
							label="Current Status"
							value={selectedMessage.currentEmploymentStatus}
						/>
						<DetailRow
							icon={Briefcase}
							label="Previous Status"
							value={selectedMessage.previousEmploymentStatus}
						/>
						<DetailRow
							icon={DollarSign}
							label="Monthly Earnings"
							value={selectedMessage.monthlyEarnings}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

