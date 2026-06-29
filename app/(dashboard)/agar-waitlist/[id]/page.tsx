"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import AgarWaitlistApi from "@/lib/api/agar-waitlist";
import { AgarWaitlistConfirmationModal } from "@/components/agar-waitlist/AgarWaitlistConfirmationModal";
import { AgarWaitlistDetailContent } from "@/components/agar-waitlist/AgarWaitlistDetailContent";
import { Button } from "@/components/ui/button";

export default function AgarWaitlistDetailPage() {
	const params = useParams();
	const router = useRouter();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const id = useMemo(() => {
		const raw = (params as { id?: string | string[] })?.id;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const { data: application, isLoading, isError, error } =
		AgarWaitlistApi.getById.useQuery(id ?? "");

	const { mutate: deleteApplication, isPending: isDeleting } =
		AgarWaitlistApi.delete.useMutation({
			onSuccess: () => router.push("/agar-waitlist"),
		});

	const errorMessage =
		(error as { response?: { data?: { message?: string } } })?.response?.data
			?.message || "Failed to load application";

	if (!id) {
		return (
			<div className="p-10 text-center text-red-500">
				Invalid application id.{" "}
				<Link href="/agar-waitlist" className="underline">
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
				<Link href="/agar-waitlist" className="underline">
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
						href="/agar-waitlist"
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
						{application.businessName} · {application.sector} · {application.city}
					</p>
				</div>
			</div>

			<AgarWaitlistConfirmationModal
				open={showDeleteModal}
				onOpenChange={setShowDeleteModal}
				title="Delete application?"
				description={`This will permanently delete ${application.fullName}'s application for ${application.businessName}. This action cannot be undone.`}
				isPending={isDeleting}
				onConfirm={() => deleteApplication(application._id)}
			/>

			<AgarWaitlistDetailContent
				application={application}
				submittedLabel={submittedLabel}
			/>
		</div>
	);
}
