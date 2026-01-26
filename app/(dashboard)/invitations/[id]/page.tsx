"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InvitationApi from "@/api/invitation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
	ArrowLeft,
	Banknote,
	Building2,
	Calendar,
	FileCheck,
	Loader2,
	MapPin,
	User,
} from "lucide-react";

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toLowerCase();
}

export default function InvitationDetailPage() {
	const params = useParams();
	const router = useRouter();

	const id = useMemo(() => {
		const raw = (params as { id?: string | string[] })?.id;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const [isHireModalOpen, setIsHireModalOpen] = useState(false);
	const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
	const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
	const [startDate, setStartDate] = useState("");

	const {
		data,
		isLoading,
		isError,
		error,
	} = InvitationApi.GetById.useQuery(id ?? "", {
		enabled: Boolean(id),
	});

	const { mutate: hireExpert, isPending: isHiring } =
		InvitationApi.Hire.useMutation({
			onSuccess: () => {
				setIsHireModalOpen(false);
				router.push("/invitations");
			},
		});

	const { mutate: acceptInvitation, isPending: isAccepting } =
		InvitationApi.Accept.useMutation({
			onSuccess: () => {
				setIsAcceptModalOpen(false);
			},
		});

	const { mutate: rejectInvitation, isPending: isRejecting } =
		InvitationApi.Reject.useMutation({
			onSuccess: () => {
				setIsRejectModalOpen(false);
			},
		});

	if (!id) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-blue-50">
					<p className="text-sm text-gray-600">Missing invitation id.</p>
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
					<p className="text-sm font-semibold text-red-600">Failed to load invitation</p>
					<p className="mt-1 text-sm text-gray-600">
						{(error as { response?: { data?: { message?: string } } })?.response?.data
							?.message || "Please try again."}
					</p>
					<Button
						variant="outline"
						className="mt-4 rounded-xl"
						onClick={() => router.push("/invitations")}
					>
						Back to list
					</Button>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="max-w-5xl mx-auto bg-white rounded-3xl p-6 shadow-sm border border-blue-50 text-center">
					<p className="text-sm text-gray-600">Invitation not found.</p>
					<Button
						variant="outline"
						className="mt-4 rounded-xl"
						onClick={() => router.push("/invitations")}
					>
						Back to list
					</Button>
				</div>
			</div>
		);
	}

	const invitation = data.invitation;
	const status = normalizeStatus(invitation.status);
	const isAccepted = status.includes("accept");
	const isRejected = status.includes("reject");
	const isHired = status.includes("hire");
	const canHire = isAccepted && !isHired;
	const canDecide = !isAccepted && !isRejected && !isHired;

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
			<div className="space-y-6 max-w-5xl mx-auto">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
					<div className="space-y-1">
						<button
							onClick={() => router.back()}
							className="text-blue-600 text-sm font-bold inline-flex items-center gap-1 hover:underline"
						>
							<ArrowLeft size={14} /> Back to List
						</button>
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
							Job Brief
						</h1>
						<p className="text-xs sm:text-sm text-gray-600">
							Invitation details and contract info
						</p>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
						<Badge
							className={cn(
								"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
								status.includes("accept")
									? "bg-[#34A853] text-white"
									: status.includes("reject")
										? "bg-red-500 text-white"
										: "bg-[#F59E0B] text-white"
							)
						}
						>
							{invitation.status || "-"}
						</Badge>

						{canDecide && (
							<div className="flex gap-2 w-full sm:w-auto">
								<Button
									variant="outline"
									onClick={() => setIsRejectModalOpen(true)}
									className="rounded-xl w-1/2 sm:w-auto"
								>
									Reject
								</Button>
								<Button
									onClick={() => setIsAcceptModalOpen(true)}
									className="bg-blue-600 hover:bg-blue-700 rounded-xl w-1/2 sm:w-auto"
								>
									Accept
								</Button>
							</div>
						)}

						{canHire && (
							<Button
								onClick={() => setIsHireModalOpen(true)}
								className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 sm:px-8 shadow-md w-full sm:w-auto"
							>
								Hire Expert
							</Button>
						)}
					</div>
				</div>

				<Card className="rounded-3xl md:rounded-[2.5rem] border-none shadow-sm bg-white">
					<CardContent className="space-y-8 p-4 sm:p-6 md:p-10">
						<div className="space-y-3">
							<h3 className="text-base sm:text-lg font-bold text-gray-800">
								Description
							</h3>
							<p className="text-sm text-gray-600 leading-relaxed">
								{invitation.description || "-"}
							</p>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6 border-t border-gray-50">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
									<User size={20} />
								</div>
								<div className="min-w-0">
									<p className="text-[10px] font-bold text-gray-400 uppercase">
										Expert
									</p>
									<p className="font-bold text-gray-700 truncate">
										{data.advisor?.firstName} {data.advisor?.lastName}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
									<Building2 size={20} />
								</div>
								<div className="min-w-0">
									<p className="text-[10px] font-bold text-gray-400 uppercase">
										Business
									</p>
									<p className="font-bold text-gray-700 truncate">
										{data.business?.businessName || "-"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
									<Calendar size={20} />
								</div>
								<div className="min-w-0">
									<p className="text-[10px] font-bold text-gray-400 uppercase">
										Duration
									</p>
									<p className="font-bold text-gray-700 truncate">
										{invitation.duration || "-"} {invitation.durationby || ""}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
									<Banknote size={20} />
								</div>
								<div className="min-w-0">
									<p className="text-[10px] font-bold text-gray-400 uppercase">
										Salary
									</p>
									<p className="font-bold text-gray-700 truncate">
										ETB {invitation.offeredSalary || "-"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
									<MapPin size={20} />
								</div>
								<div className="min-w-0">
									<p className="text-[10px] font-bold text-gray-400 uppercase">
										Location
									</p>
									<p className="font-bold text-gray-700 truncate capitalize">
										{invitation.location || "-"}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
									<FileCheck size={20} />
								</div>
								<div className="min-w-0">
									<p className="text-[10px] font-bold text-gray-400 uppercase">
										Contract Status
									</p>
									<p className="font-bold text-gray-700 truncate capitalize">
										{invitation.contratStatus || "New"}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Dialog open={isHireModalOpen} onOpenChange={setIsHireModalOpen}>
					<DialogContent className="rounded-3xl sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-xl font-bold">Confirm Hire</DialogTitle>
							<DialogDescription>
								Set the official start date for this expert’s contract.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4 py-2">
							<div className="space-y-2">
								<Label>Contract Start Date</Label>
								<Input
									type="date"
									className="bg-[#F3F8FF] border-none h-12 rounded-xl"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>
						</div>

						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setIsHireModalOpen(false)}
								className="rounded-xl"
							>
								Cancel
							</Button>
							<Button
								disabled={!startDate || isHiring}
								onClick={() =>
									hireExpert({ _id: id, startDate, status: "HIRED" })
								}
								className="bg-blue-600 text-white rounded-xl px-8"
							>
								{isHiring ? (
									<span className="inline-flex items-center gap-2">
										<Loader2 className="animate-spin" size={16} /> Hiring...
									</span>
								) : (
									"Finalize Hire"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={isAcceptModalOpen} onOpenChange={setIsAcceptModalOpen}>
					<DialogContent className="rounded-3xl sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-xl font-bold">Accept Invitation</DialogTitle>
							<DialogDescription>
								This will mark the invitation as accepted.
							</DialogDescription>
						</DialogHeader>

						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setIsAcceptModalOpen(false)}
								className="rounded-xl"
							>
								Cancel
							</Button>
							<Button
								disabled={isAccepting}
								onClick={() => acceptInvitation(id)}
								className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
							>
								{isAccepting ? (
									<span className="inline-flex items-center gap-2">
										<Loader2 className="animate-spin" size={16} /> Accepting...
									</span>
								) : (
									"Accept"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
					<DialogContent className="rounded-3xl sm:max-w-md">
						<DialogHeader>
							<DialogTitle className="text-xl font-bold">Reject Invitation</DialogTitle>
							<DialogDescription>
								This will mark the invitation as rejected.
							</DialogDescription>
						</DialogHeader>

						<DialogFooter>
							<Button
								variant="ghost"
								onClick={() => setIsRejectModalOpen(false)}
								className="rounded-xl"
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								disabled={isRejecting}
								onClick={() => rejectInvitation(id)}
								className="rounded-xl px-8"
							>
								{isRejecting ? (
									<span className="inline-flex items-center gap-2">
										<Loader2 className="animate-spin" size={16} /> Rejecting...
									</span>
								) : (
									"Reject"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}

