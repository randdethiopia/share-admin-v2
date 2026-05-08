"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Briefcase, CheckCircle, XCircle, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobApi } from "@/lib/api/job";
import { format } from "date-fns";

export default function JobsPage() {
	const { data: jobs, isLoading, isError } = JobApi.GetList.useQuery();
	const approveMutation = JobApi.Approve.useMutation();
	const rejectMutation = JobApi.Reject.useMutation();

	const handleApprove = (id: string) => approveMutation.mutate(id);
	const handleReject = (id: string) => rejectMutation.mutate(id);

	const jobsToDisplay = useMemo(() => {
		if (!jobs) return [];
		return [...jobs].sort((a, b) => {
			if (a.status === "PENDING" && b.status !== "PENDING") return -1;
			if (a.status !== "PENDING" && b.status === "PENDING") return 1;
			return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
		});
	}, [jobs]);

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
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
										{job.status === "PENDING" && (
											<div className="flex gap-2 shrink-0">
												<Button
													variant="outline"
													size="sm"
													className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
													onClick={() => handleApprove(job._id)}
													disabled={approveMutation.isPending}
												>
													<CheckCircle className="h-4 w-4 mr-1" />
													{approveMutation.isPending ? "Approving..." : "Approve"}
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
													onClick={() => handleReject(job._id)}
													disabled={rejectMutation.isPending}
												>
													<XCircle className="h-4 w-4 mr-1" />
													{rejectMutation.isPending ? "Rejecting..." : "Reject"}
												</Button>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}