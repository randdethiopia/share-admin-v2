"use client";

import { useMemo, useState } from "react";
import { Briefcase, CheckCircle, XCircle, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JobApi, type JobType } from "@/lib/api/job";
import { format } from "date-fns";

export default function JobsPage() {
	const { data: jobs, isLoading, isError } = JobApi.GetList.useQuery();
	const approveMutation = JobApi.Approve.useMutation();
	const rejectMutation = JobApi.Reject.useMutation();
	const [selectedJob, setSelectedJob] = useState<JobType | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<JobType["status"]>("PENDING");

	const handleApprove = (id: string) => approveMutation.mutate(id);
	const handleReject = (id: string) => rejectMutation.mutate(id);
	const openDrawer = (job: JobType) => {
		setSelectedJob(job);
		setSelectedStatus(job.status);
		setIsDrawerOpen(true);
	};
	const handleSaveStatus = () => {
		if (!selectedJob) return;
		if (selectedStatus === selectedJob.status || selectedStatus === "PENDING") return;
		if (selectedStatus === "APPROVED") {
			handleApprove(selectedJob._id);
		} else if (selectedStatus === "REJECTED") {
			handleReject(selectedJob._id);
		}
		setIsDrawerOpen(false);
	};

	const jobsToDisplay = useMemo(() => {
		if (!jobs) return [];
		return [...jobs].sort((a, b) => {
			if (a.status === "PENDING" && b.status !== "PENDING") return -1;
			if (a.status !== "PENDING" && b.status === "PENDING") return 1;
			return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
		});
	}, [jobs]);

	const getLocationText = (job: JobType) => {
		if (!job.location) return "Not provided";
		if (typeof job.location === "string") return job.location;
		return job.location.address || "Not provided";
	};

	return (
		<div className="bg-[#E2EDF8]">
			<div className="mx-auto max-w-5xl space-y-6">
				<div className="rounded-3xl border border-blue-50 bg-white p-6 shadow-sm md:p-10">
					<div className="flex items-start gap-4">
						<div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
							<Briefcase className="h-6 w-6" />
						</div>
						<div className="space-y-2">
							<p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
								Jobs Workspace
							</p>
							<h1 className="text-2xl font-bold text-gray-900">Manage Job Postings</h1>
							<p className="max-w-2xl text-sm text-gray-600">
								Review and approve jobs posted by businesses.
							</p>
						</div>
					</div>

					<div className="mt-8">
						{isLoading ? (
							<div className="flex h-32 items-center justify-center">
								<Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
							</div>
						) : isError ? (
							<div className="flex h-32 items-center justify-center text-red-500">
								Error loading jobs.
							</div>
						) : jobsToDisplay.length === 0 ? (
							<div className="flex h-32 items-center justify-center text-slate-500">
								No jobs found.
							</div>
						) : (
							<div className="grid gap-4">
								{jobsToDisplay.map((job) => (
									<div key={job._id} className="flex flex-col md:flex-row md:items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 md:p-6 gap-4">
										<div className="space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<h3 className="text-lg font-semibold text-slate-900">{job.jobTitle || job.title || "Untitled Job"}</h3>
												{job.status === "PENDING" && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>}
												{job.status === "APPROVED" && <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>}
												{job.status === "REJECTED" && <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>}
											</div>
											<div className="text-sm text-slate-600">
												<span className="font-medium text-slate-800">{job.companyName || "Unknown Company"}</span> • {job.jobType || job.employmentType || "Job"}
											</div>
											<p className="text-sm text-slate-500 max-w-3xl line-clamp-2">
												{job.jobDescription || job.description || "No description provided."}
											</p>
											{job.createdAt && (
												<p className="text-xs text-slate-400 mt-2">
													Posted on {format(new Date(job.createdAt), "MMM d, yyyy")}
												</p>
											)}
										</div>
										<div className="flex flex-wrap gap-2 shrink-0">
											<Button
													variant="outline"
													size="sm"
													className="border-slate-200 text-slate-700 hover:bg-slate-100"
													onClick={() => openDrawer(job)}
												>
													View Details
												</Button>
											{job.status === "PENDING" && (
												<div className="flex flex-wrap gap-2">
													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant="outline"
																size="sm"
																className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
																disabled={approveMutation.isPending}
															>
																<CheckCircle className="h-4 w-4 mr-1" />
																{approveMutation.isPending ? "Approving..." : "Approve"}
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
																<AlertDialogDescription>
																	This will approve the job posting. Approved jobs will be visible to the public. Do you want to continue?
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() => handleApprove(job._id)}
																	className="bg-green-600 hover:bg-green-700"
																>
																	Yes, Approve
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>

													<AlertDialog>
														<AlertDialogTrigger asChild>
															<Button
																variant="outline"
																size="sm"
																className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
																disabled={rejectMutation.isPending}
															>
																<XCircle className="h-4 w-4 mr-1" />
																{rejectMutation.isPending ? "Rejecting..." : "Reject"}
															</Button>
														</AlertDialogTrigger>
														<AlertDialogContent>
															<AlertDialogHeader>
																<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
																<AlertDialogDescription>
																	This will reject the job posting. This action will notify the business and hide the job. Do you want to continue?
																</AlertDialogDescription>
															</AlertDialogHeader>
															<AlertDialogFooter>
																<AlertDialogCancel>Cancel</AlertDialogCancel>
																<AlertDialogAction
																	onClick={() => handleReject(job._id)}
																	className="bg-red-600 hover:bg-red-700"
																>
																	Yes, Reject
																</AlertDialogAction>
															</AlertDialogFooter>
														</AlertDialogContent>
													</AlertDialog>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<Drawer
				open={isDrawerOpen}
				onOpenChange={(open) => {
					setIsDrawerOpen(open);
					if (!open) {
						setSelectedJob(null);
						setSelectedStatus("PENDING");
					}
				}}
			>
				<DrawerContent className="bg-white flex flex-col max-h-[90vh]">
					<DrawerHeader className="border-b border-slate-100">
						<DrawerTitle>
							{selectedJob?.jobTitle || selectedJob?.title || "Job Details"}
						</DrawerTitle>
						<DrawerDescription>View job details and update approval status.</DrawerDescription>
					</DrawerHeader>

					<div className="flex-1 overflow-y-auto">
						{selectedJob ? (
							<div className="space-y-4 p-4" key={selectedJob._id}>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Job title
										</label>
										<Input
											defaultValue={selectedJob.jobTitle || selectedJob.title || ""}
											readOnly
										/>
									</div>
									<div className="space-y-2">
										<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Company
										</label>
										<Input
											defaultValue={selectedJob.companyName || ""}
											readOnly
										/>
									</div>
									<div className="space-y-2">
										<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Job type
										</label>
										<Input
											defaultValue={selectedJob.jobType || selectedJob.employmentType || ""}
											readOnly
										/>
									</div>
									<div className="space-y-2">
										<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Location
										</label>
										<Input
											defaultValue={getLocationText(selectedJob)}
											readOnly
										/>
									</div>
									<div className="space-y-2">
										<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Salary
										</label>
										<Input
											defaultValue={selectedJob.salary || ""}
											readOnly
										/>
									</div>
									<div className="space-y-2">
										<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
											Status
										</label>
										<Select
											value={selectedStatus}
											onValueChange={(value) => setSelectedStatus(value)}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder={selectedJob.status} />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="PENDING">Pending (no action)</SelectItem>
												<SelectItem value="APPROVED">Approved</SelectItem>
												<SelectItem value="REJECTED">Rejected</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Description
									</label>
									<Textarea
										defaultValue={selectedJob.jobDescription || selectedJob.description || ""}
										readOnly
										rows={6}
									/>
								</div>

								<div className="space-y-2">
									<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
										Requirements
									</label>
									<Textarea
										defaultValue={
											Array.isArray(selectedJob.requirements)
												? selectedJob.requirements.join("\n")
												: selectedJob.requirements || ""
										}
										readOnly
										rows={4}
									/>
								</div>

								<div className="text-xs text-slate-500">
									Posted: {selectedJob.createdAt ? format(new Date(selectedJob.createdAt), "MMM d, yyyy") : "Unknown"}
									{selectedJob.updatedAt ? ` • Updated: ${format(new Date(selectedJob.updatedAt), "MMM d, yyyy")}` : ""}
								</div>
							</div>
						) : null}
					</div>

					<DrawerFooter className="border-t border-slate-100">
						<div className="flex flex-wrap gap-2">
							<DrawerClose asChild>
								<Button variant="outline">Close</Button>
							</DrawerClose>
							<Button
								className="bg-blue-600 hover:bg-blue-700"
								disabled={
									!selectedJob ||
									selectedStatus === selectedJob.status ||
									selectedStatus === "PENDING"
								}
								onClick={handleSaveStatus}
							>
								Save Status
							</Button>
						</div>
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	);
}