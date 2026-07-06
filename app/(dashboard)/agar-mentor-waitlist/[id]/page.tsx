"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import AgarMentorWaitlistApi from "@/lib/api/agar-mentor-waitlist";
import { AgarWaitlistConfirmationModal } from "@/components/agar-waitlist/AgarWaitlistConfirmationModal";
import { AgarMentorWaitlistDetailContent } from "@/components/agar-mentor-waitlist/AgarMentorWaitlistDetailContent";
import { Button } from "@/components/ui/button";

export default function AgarMentorWaitlistDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const id = useMemo(() => {
		const raw = (params as { id?: string | string[] })?.id;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const { data: application, isLoading, isError, error } =
		AgarMentorWaitlistApi.getById.useQuery(id ?? "");

	const { mutate: deleteApplication, isPending: isDeleting } =
		AgarMentorWaitlistApi.delete.useMutation({
			onSuccess: () => router.push("/agar-mentor-waitlist"),
		});

	const errorMessage =
		(error as { response?: { data?: { message?: string } } })?.response?.data
			?.message || "Failed to load application";

	if (!id) {
		return (
			<div className="p-10 text-center text-red-500">
				Invalid application id.{" "}
				<Link href="/agar-mentor-waitlist" className="underline">
					Go back
				</Link>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center text-sm text-gray-600">
				<Loader2 className="mr-2 h-5 w-5 animate-spin" />
				Loading application...
			</div>
		);
	}

	if (isError || !application) {
		return (
			<div className="p-10 text-center text-red-500">
				{errorMessage}.{" "}
				<Link href="/agar-mentor-waitlist" className="underline">
					Go back
				</Link>
			</div>
		);
	}

	const submittedLabel = application.createdAt
		? format(new Date(application.createdAt), "MMM d, yyyy 'at' h:mm a")
		: "Unknown";

	return (
		<div className="w-full min-w-0 space-y-6">
			<div className="rounded-3xl border border-blue-50 bg-white p-5 shadow-sm sm:p-8">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<Link
						href="/agar-mentor-waitlist"
						className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to waitlist
					</Link>

					<Button
						type="button"
						variant="outline"
						disabled={isDeleting}
						onClick={() => setShowDeleteModal(true)}
						className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</Button>
				</div>

				<div className="mt-5 space-y-2">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
						{application.fullName}
					</h1>
					<p className="text-sm font-medium text-gray-600">
						{application.currentJobTitle} · {application.currentOrganization} ·{" "}
						{application.mentorType}
					</p>
				</div>
			</div>

			<AgarWaitlistConfirmationModal
				open={showDeleteModal}
				onOpenChange={setShowDeleteModal}
				title="Delete application?"
				description={`This will permanently delete ${application.fullName}'s mentor application. This action cannot be undone.`}
				isPending={isDeleting}
				onConfirm={() => deleteApplication(application._id)}
			/>

			<AgarMentorWaitlistDetailContent
				application={application}
				submittedLabel={submittedLabel}
			/>
		</div>
	);
}
