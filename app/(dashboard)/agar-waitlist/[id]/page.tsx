"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import AgarWaitlistApi from "@/lib/api/agar-waitlist";
import { AgarWaitlistDetailContent } from "@/components/agar-waitlist/AgarWaitlistDetailContent";

export default function AgarWaitlistDetailPage() {
	const params = useParams();

	const id = useMemo(() => {
		const raw = (params as { id?: string | string[] })?.id;
		return Array.isArray(raw) ? raw[0] : raw;
	}, [params]);

	const { data: application, isLoading, isError, error } =
		AgarWaitlistApi.getById.useQuery(id ?? "");

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
				<Link
					href="/agar-waitlist"
					className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to waitlist
				</Link>

				<div className="mt-5 space-y-2">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
						{application.fullName}
					</h1>
					<p className="text-sm font-medium text-gray-600">
						{application.businessName} · {application.sector} · {application.city}
					</p>
				</div>
			</div>

			<AgarWaitlistDetailContent
				application={application}
				submittedLabel={submittedLabel}
			/>
		</div>
	);
}
