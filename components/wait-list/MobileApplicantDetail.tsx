"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
	Briefcase,
	Calendar,
	ChevronLeft,
	DollarSign,
	Globe,
	GraduationCap,
	Laptop,
	Mail,
	MapPin,
	Phone,
	User,
} from "lucide-react";

import type { ApplicantListItem } from "@/lib/api/waitlist";
import {
	formatDigitalDevices,
	formatDisabilityType,
	formatEducationalBackground,
	formatEmploymentStatus,
	formatMaritalStatus,
} from "@/lib/api/applicantLabels";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		<div className="flex items-start gap-4 py-3 border-b border-slate-100 last:border-0">
			<div className="p-2 bg-slate-50 rounded-lg text-slate-400">
				<Icon size={14} />
			</div>
			<div className="space-y-0.5 min-w-0">
				<p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
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
	const parts = name.trim().split(/\s+/).filter(Boolean);
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

export type MobileApplicantDetailProps = {
	selectedMessage: ApplicantListItem | null;
	setSelectedMessage: (message: ApplicantListItem | null) => void;
	getInitials?: (name: string) => string;
	getStatusColor?: (status: string) => string;
};

export function MobileApplicantDetail({
	selectedMessage,
	getInitials = defaultGetInitials,
	getStatusColor = defaultGetStatusColor,
	setSelectedMessage,
}: MobileApplicantDetailProps) {
	if (!selectedMessage) return null;

	const fullName = [
		selectedMessage.firstName,
		selectedMessage.middleName,
		selectedMessage.lastName,
	]
		.filter(Boolean)
		.join(" ");
	const email = (selectedMessage.email ?? "").toString();
	const age = selectedMessage.age;
	const educationLabel = formatEducationalBackground(
		selectedMessage.educationalBackground
	);
	const employmentLabel = formatEmploymentStatus(selectedMessage.employmentStatus);
	const cityName = selectedMessage.city?.name ?? "";
	const subcityName = selectedMessage.subcity?.name ?? "";
	const disabilityLabel =
		selectedMessage.hasDisability === "yes"
			? formatDisabilityType(selectedMessage.disabilityType) || "Yes"
			: selectedMessage.hasDisability === "no"
				? "No"
				: "";

	return (
		/* Full screen overlay (mobile only) */
		<div className="fixed inset-0 bg-white z-50 md:hidden flex flex-col overflow-hidden">
			{/* Sticky header */}
			<div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3 z-10">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setSelectedMessage(null)}
					className="rounded-full hover:bg-slate-100"
					type="button"
				>
					<ChevronLeft className="h-6 w-6 text-slate-900" />
				</Button>
				<h2 className="font-bold text-lg text-slate-900 truncate">
					{fullName || "—"}
				</h2>
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-20">
				{/* Profile summary */}
				<div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2rem]">
					<Avatar className="h-16 w-16 border-2 border-white shadow-sm">
						<AvatarFallback className="bg-blue-600 text-white font-bold uppercase">
							{getInitials(fullName)}
						</AvatarFallback>
					</Avatar>
					<div className="space-y-1 min-w-0">
						<div className="flex gap-2 items-center">
							<Badge
								className={cn(
									"rounded-full font-bold text-[9px] uppercase",
									getStatusColor(employmentLabel)
								)}
							>
								{employmentLabel || "—"}
							</Badge>
							{typeof age === "number" && !Number.isNaN(age) && (
								<span className="text-xs text-slate-400 font-medium">
									{age} yrs
								</span>
							)}
						</div>
						<div className="flex flex-wrap gap-1.5">
							{selectedMessage.batch ? (
								<Badge
									variant="outline"
									className="rounded-full border-slate-200 text-slate-500 font-bold text-[9px] uppercase"
								>
									{selectedMessage.batch}
								</Badge>
							) : null}
							{selectedMessage.gender ? (
								<Badge
									variant="outline"
									className="rounded-full border-slate-200 text-slate-500 font-bold text-[9px] uppercase"
								>
									{selectedMessage.gender}
								</Badge>
							) : null}
							{educationLabel ? (
								<Badge
									variant="outline"
									className="rounded-full border-slate-200 text-slate-500 font-bold text-[9px] uppercase truncate max-w-40"
								>
									{educationLabel}
								</Badge>
							) : null}
						</div>
						<div className="text-xs text-slate-500 font-medium flex items-center gap-1 min-w-0">
							<Mail size={12} />
							<span className="truncate">{email || "—"}</span>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="details" className="w-full">
					<TabsList className="w-full bg-slate-100 p-1 rounded-2xl mb-6">
						<TabsTrigger
							value="details"
							className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-white"
						>
							Info
						</TabsTrigger>
						<TabsTrigger
							value="education"
							className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-white"
						>
							Skills
						</TabsTrigger>
						<TabsTrigger
							value="employment"
							className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-white"
						>
							Work
						</TabsTrigger>
					</TabsList>

					<TabsContent value="details" className="space-y-4 mt-0">
						<Card className="rounded-[1.5rem] border-none bg-slate-50/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-bold flex items-center gap-2">
									<User size={16} /> Personal
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-0">
								<DetailRow icon={User} label="Full Name" value={fullName} />
								<DetailRow
									icon={Globe}
									label="Gender"
									value={
										selectedMessage.gender ? (
											<span className="capitalize">{selectedMessage.gender}</span>
										) : undefined
									}
								/>
								<DetailRow
									icon={Phone}
									label="Phone"
									value={selectedMessage.phoneNumber}
								/>
								<DetailRow
									icon={Calendar}
									label="Birth Date"
									value={selectedMessage.birthDate}
								/>
								<DetailRow
									icon={User}
									label="Marital Status"
									value={formatMaritalStatus(selectedMessage.maritalStatus)}
								/>
								<DetailRow
									icon={User}
									label="Has Disability"
									value={disabilityLabel}
								/>
							</CardContent>
						</Card>

						<Card className="rounded-[1.5rem] border-none bg-slate-50/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-bold flex items-center gap-2">
									<MapPin size={16} /> Location
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-0">
								<DetailRow icon={MapPin} label="Region" value={selectedMessage.region} />
								<DetailRow icon={MapPin} label="City" value={cityName} />
								<DetailRow icon={MapPin} label="Subcity" value={subcityName} />
								<DetailRow icon={MapPin} label="Zone" value={selectedMessage.zone} />
								<DetailRow icon={MapPin} label="Woreda" value={selectedMessage.woreda} />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="education" className="space-y-2 mt-0">
						<DetailRow
							icon={GraduationCap}
							label="Educational Background"
							value={educationLabel}
						/>
						<DetailRow
							icon={Laptop}
							label="Technical Digital Skills"
							value={selectedMessage.technicalDigitalSkills}
						/>
						<DetailRow
							icon={Laptop}
							label="Digital Devices"
							value={formatDigitalDevices(selectedMessage.digitalDevices)}
						/>
						<DetailRow
							icon={Globe}
							label="English Proficiency"
							value={selectedMessage.englishProficiency}
						/>
						<DetailRow
							icon={Globe}
							label="Amharic Proficiency"
							value={selectedMessage.amharicProficiency}
						/>
					</TabsContent>

					<TabsContent value="employment" className="space-y-2 mt-0">
						<DetailRow
							icon={Briefcase}
							label="Current Status"
							value={employmentLabel}
						/>
						<DetailRow
							icon={Briefcase}
							label="Previous Status"
							value={formatEmploymentStatus(selectedMessage.previousEmploymentStatus)}
						/>
						<DetailRow
							icon={DollarSign}
							label="Monthly Earnings"
							value={selectedMessage.monthlyEarnings}
						/>
						<DetailRow
							icon={Briefcase}
							label="Weekly Commitment"
							value={selectedMessage.weeklyCommitment}
						/>
					</TabsContent>
				</Tabs>
			</div>

			{/* Bottom close button */}
			<div className="p-4 border-t bg-white">
				<Button
					variant="outline"
					className="w-full rounded-xl font-bold h-12 border-slate-200"
					onClick={() => setSelectedMessage(null)}
					type="button"
				>
					Close Profile
				</Button>
			</div>
		</div>
	);
}
