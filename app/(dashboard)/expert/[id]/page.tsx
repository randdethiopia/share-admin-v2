"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Banknote,
	Briefcase,
	Calendar,
	Check,
	Download,
	Globe,
	GraduationCap,
	Loader2,
	Mail,
	Phone,
	X,
} from "lucide-react";

import AdvisorProfileApi from "@/api/advisor-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

function getInitials(name?: string) {
	if (!name) return "—";
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
	return `${first}${last}`.toUpperCase() || "—";
}

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function statusBadgeClass(status?: string) {
	switch (normalizeStatus(status)) {
		case "APPROVED":
			return "bg-[#E6F4EA] text-[#1E8E3E]";
		case "REJECTED":
			return "bg-[#FDECEC] text-[#B91C1C]";
		case "DRAFT":
			return "bg-slate-100 text-slate-600";
		case "PENDING":
		default:
			return "bg-[#FFF7E6] text-[#B45309]";
	}
}

function formatDate(value?: string) {
	if (!value) return "-";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleDateString();
}

function getFileUrl(file: unknown) {
	if (!file) return "";
	if (typeof file === "string") return file;
	if (Array.isArray(file)) {
		const first = file[0] as { url?: string } | undefined;
		return first?.url ?? "";
	}
	return (file as { url?: string }).url ?? "";
}

export default function ExpertDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = useMemo(() => {
		const raw = (params as { id?: string | string[] })?.id;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const [approveOpen, setApproveOpen] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);

	const {
		data: advisor,
		isLoading,
		isError,
		error,
	} = AdvisorProfileApi.GetById.useQuery(id ?? "", {
		queryKey: ["AdvisorProfile", id ?? ""],
		enabled: Boolean(id),
	});

	const { mutate: approve, isPending: isApproving } =
		AdvisorProfileApi.Approve.useMutation({
			onSuccess: () => setApproveOpen(false),
		});
	const { mutate: reject, isPending: isRejecting } =
		AdvisorProfileApi.Reject.useMutation({
			onSuccess: () => setRejectOpen(false),
		});

	const isMutating = isApproving || isRejecting;

	if (!id) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-blue-50">
					<p className="text-sm text-gray-600">Missing expert id.</p>
					<Button
						variant="outline"
						className="mt-4 rounded-xl"
						onClick={() => router.push("/expert")}
					>
						Back to list
					</Button>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="max-w-5xl mx-auto h-64 flex items-center justify-center">
					<Loader2 className="animate-spin text-blue-600" />
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-blue-50">
					<p className="text-sm font-semibold text-red-600">Failed to load expert</p>
					<p className="mt-1 text-sm text-gray-600">
						{(error as { response?: { data?: { message?: string } } })?.response
							?.data?.message || "Please try again."}
					</p>
					<Button
						variant="outline"
						className="mt-4 rounded-xl"
						onClick={() => router.push("/expert")}
					>
						Back to list
					</Button>
				</div>
			</div>
		);
	}

	if (!advisor) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-blue-50 text-center">
					<p className="text-sm text-gray-600">Expert not found.</p>
					<Button
						variant="outline"
						className="mt-4 rounded-xl"
						onClick={() => router.push("/expert")}
					>
						Back to list
					</Button>
				</div>
			</div>
		);
	}

	const status = normalizeStatus(advisor.status);
	const canDecide = status === "PENDING";

	const skills = Array.isArray(advisor.skills) ? advisor.skills : [];
	const languages = Array.isArray(advisor.languages) ? advisor.languages : [];
	const education = Array.isArray(advisor.education) ? advisor.education : [];
	const experience = Array.isArray(advisor.experience) ? advisor.experience : [];
	const cvUrl = getFileUrl(advisor.cv);

	return (
		<div className="min-h-screen bg-white">
			<AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
				<AlertDialogContent className="rounded-3xl sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-xl font-bold">
							Approve expert?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will mark the expert as approved. This action can’t be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isApproving}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								approve(advisor._id);
							}}
							disabled={isApproving}
							className="bg-emerald-600 hover:bg-emerald-700"
						>
							{isApproving ? "Approving…" : "Approve"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
				<AlertDialogContent className="rounded-3xl sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-xl font-bold">
							Reject expert?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will mark the expert as rejected. This action can’t be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRejecting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								reject(advisor._id);
							}}
							disabled={isRejecting}
							className="bg-red-600 hover:bg-red-700"
						>
							{isRejecting ? "Rejecting…" : "Reject"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="w-full bg-[#E2EDF8] py-10 sm:py-16 px-4 sm:px-6">
				<div className="max-w-6xl mx-auto flex flex-col gap-6">
					<button
						onClick={() => router.back()}
						className="text-blue-600 text-sm font-bold inline-flex items-center gap-1 hover:underline w-fit"
					>
						<ArrowLeft size={14} /> Back to list
					</button>

					<div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
						<Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-xl">
							<AvatarImage src={advisor.avatar?.url} />
							<AvatarFallback className="bg-blue-600 text-white text-3xl font-bold">
								{getInitials(advisor.fullName)}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1 text-center md:text-left space-y-4 min-w-0">
							<h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight truncate">
								{advisor.fullName || "—"}
							</h1>
							<div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 font-bold text-xs sm:text-sm uppercase">
								<div className="flex items-center gap-2">
									<GraduationCap size={16} /> {advisor.qualification || "-"}
								</div>
								<div className="flex items-center gap-2">
									<Globe size={16} />
									{languages.length ? languages.join(", ") : "-"}
								</div>
								<div className="flex items-center gap-2">
									<Banknote size={16} /> ETB {advisor.salaryExpectation || "-"} / mo
								</div>
							</div>
							<div className="flex flex-wrap justify-center md:justify-start gap-2">
								{skills.length ? (
									skills.map((s) => (
										<Badge
											key={s}
											className="bg-white/60 text-blue-600 border-none hover:bg-white transition-colors"
										>
											{s}
										</Badge>
									))
								) : (
									<span className="text-xs text-gray-500">No skills listed</span>
								)}
							</div>
						</div>

						<div className="flex flex-col gap-3 w-full md:w-auto">
							<div className="flex items-center justify-center md:justify-end gap-2">
								<Badge
									className={cn(
										"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
										statusBadgeClass(status)
									)}
								>
									{status || "PENDING"}
								</Badge>
							</div>

							{canDecide && (
								<div className="flex gap-2 justify-center md:justify-end">
									<Button
										variant="outline"
										disabled={isMutating}
										onClick={() => setRejectOpen(true)}
										className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 h-10 w-10 p-0"
									>
										<X size={20} />
									</Button>
									<Button
										variant="outline"
										disabled={isMutating}
										onClick={() => setApproveOpen(true)}
										className="rounded-xl border-emerald-200 text-emerald-500 hover:bg-emerald-50 h-10 w-10 p-0"
									>
										<Check size={20} />
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
				<div className="lg:col-span-8 space-y-10">
					<section className="space-y-4">
						<h3 className="text-lg sm:text-xl font-bold text-gray-800">
							Expert Description
						</h3>
						<p className="text-gray-500 leading-relaxed text-sm sm:text-base">
							{advisor.description || "-"}
						</p>
					</section>

					<section className="space-y-6">
						<h3 className="text-lg sm:text-xl font-bold text-gray-800">
							Education
						</h3>
						{education.length ? (
							education.map((edu, i) => (
								<div key={`${edu.title}-${i}`} className="flex gap-5">
									<div className="flex flex-col items-center">
										<div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
											{edu.title?.charAt(0) || "E"}
										</div>
										<div className="flex-1 w-px bg-slate-100 my-2" />
									</div>
									<div className="pb-6">
										<h4 className="font-bold text-gray-900 text-base sm:text-lg">
											{edu.title || "-"}
										</h4>
										<p className="text-blue-500 font-bold text-xs sm:text-sm uppercase">
											{edu.academy || "-"} • {edu.year || "-"}
										</p>
										<p className="text-gray-400 mt-2 text-sm leading-relaxed">
											{edu.description || "-"}
										</p>
									</div>
								</div>
							))
						) : (
							<p className="text-sm text-gray-500">No education history.</p>
						)}
					</section>

					<section className="space-y-6">
						<h3 className="text-lg sm:text-xl font-bold text-gray-800">
							Work &amp; Experience
						</h3>
						{experience.length ? (
							experience.map((exp, i) => (
								<div key={`${exp.title}-${i}`} className="flex gap-5">
									<div className="flex flex-col items-center">
										<div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
											{exp.title?.charAt(0) || "W"}
										</div>
										<div className="flex-1 w-px bg-slate-100 my-2" />
									</div>
									<div className="pb-6">
										<h4 className="font-bold text-gray-900 text-base sm:text-lg">
											{exp.title || "-"}
										</h4>
										<p className="text-emerald-600 font-bold text-xs sm:text-sm uppercase">
											{exp.company || "-"} • {exp.startDate || "-"} -
											{exp.endDate || "-"}
										</p>
										<p className="text-gray-400 mt-2 text-sm leading-relaxed">
											{exp.description || "-"}
										</p>
									</div>
								</div>
							))
						) : (
							<p className="text-sm text-gray-500">No experience listed.</p>
						)}
					</section>
				</div>

				<aside className="lg:col-span-4 space-y-8">
					<div className="bg-slate-50 p-6 sm:p-8 rounded-[2.5rem] space-y-6 lg:sticky lg:top-24">
						<h3 className="font-black text-gray-900 uppercase tracking-widest text-xs border-b pb-4">
							Overview
						</h3>

						<div className="flex items-center gap-4">
							<div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
								<Calendar size={20} />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] font-bold text-gray-400 uppercase">
									Experience
								</p>
								<p className="font-bold text-gray-700 truncate">
									{advisor.experienceYear || "-"} Years
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
								<GraduationCap size={20} />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] font-bold text-gray-400 uppercase">
									Qualification
								</p>
								<p className="font-bold text-gray-700 truncate">
									{advisor.qualification || "-"}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
								<Briefcase size={20} />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] font-bold text-gray-400 uppercase">
									Created
								</p>
								<p className="font-bold text-gray-700 truncate">
									{formatDate(advisor.createdAt)}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
								<Mail size={20} />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] font-bold text-gray-400 uppercase">
									Email
								</p>
								<p className="font-bold text-gray-700 truncate">
									{advisor.email || "-"}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
								<Phone size={20} />
							</div>
							<div className="min-w-0">
								<p className="text-[10px] font-bold text-gray-400 uppercase">
									Phone
								</p>
								<p className="font-bold text-gray-700 truncate">
									{advisor.phoneNumber || "-"}
								</p>
							</div>
						</div>

						<div className="space-y-4 pt-4 border-t">
							<p className="text-[10px] font-bold text-gray-400 uppercase">
								Skills
							</p>
							<div className="flex flex-wrap gap-2">
								{skills.length ? (
									skills.map((s) => (
										<Badge
											key={s}
											variant="outline"
											className="border-slate-200 text-slate-500 font-bold"
										>
											{s}
										</Badge>
									))
								) : (
									<span className="text-xs text-gray-500">No skills listed</span>
								)}
							</div>
						</div>

						<div className="pt-4 border-t">
							<p className="text-[10px] font-bold text-gray-400 uppercase mb-4">
								Attachment
							</p>
							<a
								href={cvUrl || "#"}
								target="_blank"
								rel="noreferrer"
								download={Boolean(cvUrl)}
								className={cn(
									"flex items-center justify-between w-full p-4 rounded-2xl font-bold transition-all shadow-sm",
									cvUrl
										? "bg-white text-blue-600 hover:bg-blue-50"
										: "bg-slate-100 text-slate-400 pointer-events-none"
								)}
							>
								Download CV <Download size={18} />
							</a>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
}
