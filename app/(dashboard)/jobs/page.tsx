"use client";
import { useMemo, useState } from "react";
import { CheckCircle, XCircle, Loader2Icon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/admin/PageHeader";
import { StatusBadge } from "@/components/shared/admin/StatusBadge";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { JobApi, type JobType } from "@/lib/api/job";
import { format } from "date-fns";

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
        </div>
    );
}

function TextBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{value || "—"}</p>
        </div>
    );
}

function getLocationText(job: JobType): string {
    if (!job.location) return "Not provided";
    if (typeof job.location === "string") return job.location;
    return job.location.address || "Not provided";
}

function JobDetailContent({
    job,
    selectedStatus,
    setSelectedStatus,
}: {
    job: JobType;
    selectedStatus: JobType["status"];
    setSelectedStatus: (value: JobType["status"]) => void;
}) {
    return (
        <div className="space-y-6">
            
            <div className="rounded-xl bg-slate-50 p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Job Title" value={job.jobTitle || job.title || ""} />
                    <Field label="Company" value={job.companyName || ""} />
                    <Field label="Job Type" value={job.jobType || job.employmentType || ""} />
                    <Field label="Location" value={getLocationText(job)} />
                    <Field label="Salary" value={job.salary || "Not specified"} />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Status</p>
                        <div>
                            <StatusBadge status={job.status} />
                        </div>
                    </div>
                </div>
            </div>

            
            <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <TextBlock
                    label="Description"
                    value={job.jobDescription || job.description || "No description provided."}
                />
            </div>

            
            <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <TextBlock
                    label="Requirements"
                    value={
                        Array.isArray(job.requirements)
                            ? job.requirements.join("\n")
                            : job.requirements || "No specific requirements provided."
                    }
                />
            </div>

            
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Update Status</p>
                <p className="text-xs text-blue-400 mb-2">This is the only field you can change.</p>
                <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as JobType["status"])}
                >
                    <SelectTrigger className="w-full bg-white border-blue-200">
                        <SelectValue placeholder={job.status} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PENDING">Pending (no action)</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 space-y-1">
                <p>Posted: {job.createdAt ? format(new Date(job.createdAt), "MMM d, yyyy 'at' h:mm a") : "Unknown"}</p>
                {job.updatedAt && job.updatedAt !== job.createdAt && (
                    <p>Last updated: {format(new Date(job.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                )}
            </div>
        </div>
    );
}

export default function JobsPage() {
    const { data: jobs, isLoading, isError } = JobApi.GetList.useQuery();
    const approveMutation = JobApi.Approve.useMutation();
    const rejectMutation = JobApi.Reject.useMutation();
    const [selectedJob, setSelectedJob] = useState<JobType | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<JobType["status"]>("PENDING");
    const isSavingStatus = approveMutation.isPending || rejectMutation.isPending;

    const handleApprove = (id: string) => approveMutation.mutate(id);
    const handleReject = (id: string) => rejectMutation.mutate(id);

    const openPanel = (job: JobType) => {
        setSelectedJob(job);
        setSelectedStatus(job.status);
        setIsPanelOpen(true);
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        setSelectedJob(null);
        setSelectedStatus("PENDING");
    };

    const handleSaveStatus = async () => {
        if (!selectedJob) return;
        if (selectedStatus === selectedJob.status || selectedStatus === "PENDING") return;
        if (selectedStatus !== "APPROVED" && selectedStatus !== "REJECTED") return;
        try {
            if (selectedStatus === "APPROVED") {
                await approveMutation.mutateAsync(selectedJob._id);
            } else {
                await rejectMutation.mutateAsync(selectedJob._id);
            }
            setSelectedJob((prev) => prev ? { ...prev, status: selectedStatus } : prev);
            closePanel();
        } catch {
            
        }
    };

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
                    <PageHeader
                        category="Jobs Workspace"
                        title="Manage Job Postings"
                        description="Review and approve jobs posted by businesses."
                        className="mb-8"
                    />
                    <div>
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
                                        <div className="space-y-2 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-semibold text-slate-900">
                                                    {job.jobTitle || job.title || "Untitled Job"}
                                                </h3>
                                                <StatusBadge status={job.status} />
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
                                                onClick={() => openPanel(job)}
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

            
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
                    isPanelOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {selectedJob?.jobTitle || selectedJob?.title || "Job Details"}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    View job details and update approval status
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={closePanel} className="h-8 w-8 rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {selectedJob && (
                            <JobDetailContent
                                job={selectedJob}
                                selectedStatus={selectedStatus}
                                setSelectedStatus={setSelectedStatus}
                            />
                        )}
                    </div>
                    <div className="border-t border-slate-200 px-6 py-4">
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={closePanel} className="flex-1">Cancel</Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={
                                    !selectedJob ||
                                    selectedStatus === selectedJob?.status ||
                                    selectedStatus === "PENDING" ||
                                    isSavingStatus
                                }
                                onClick={handleSaveStatus}
                            >
                                {isSavingStatus ? "Saving..." : "Save Status"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {isPanelOpen && (
                <div
                    className="fixed inset-0 z-40 backdrop-blur-sm bg-white/30 transition-all duration-300"
                    onClick={closePanel}
                />
            )}

            
            <Drawer
                open={isPanelOpen && window.innerWidth < 1024}
                onOpenChange={(open) => { if (!open) closePanel(); }}
            >
                <DrawerContent className="bg-white flex flex-col max-h-[90vh]">
                    <DrawerHeader className="border-b border-slate-100">
                        <DrawerTitle>{selectedJob?.jobTitle || selectedJob?.title || "Job Details"}</DrawerTitle>
                        <DrawerDescription>View job details and update approval status.</DrawerDescription>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto p-4">
                        {selectedJob && (
                            <JobDetailContent
                                job={selectedJob}
                                selectedStatus={selectedStatus}
                                setSelectedStatus={setSelectedStatus}
                            />
                        )}
                    </div>
                    <DrawerFooter className="border-t border-slate-100">
                        <div className="flex flex-wrap gap-2">
                            <DrawerClose asChild>
                                <Button variant="outline" className="flex-1">Close</Button>
                            </DrawerClose>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={
                                    !selectedJob ||
                                    selectedStatus === selectedJob.status ||
                                    selectedStatus === "PENDING" ||
                                    isSavingStatus
                                }
                                onClick={handleSaveStatus}
                            >
                                {isSavingStatus ? "Saving..." : "Save Status"}
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}