"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BlogApi from "@/api/blog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, FileText, Loader2, User } from "lucide-react";

function normalizeStatus(status?: string) {
	return (status ?? "").trim().toUpperCase();
}

function statusBadgeClass(status: string) {
	if (status === "APPROVED") return "bg-[#34A853] text-white";
	if (status === "REJECTED") return "bg-red-500 text-white";
	return "bg-[#F59E0B] text-white";
}

export default function BlogDetailPage() {
	const params = useParams<{ id?: string | string[] }>();
	const router = useRouter();

	const id = useMemo(() => {
		const raw = params?.id;
		if (!raw) return "";
		return Array.isArray(raw) ? raw[0] ?? "" : raw;
	}, [params]);

	const {
		data: blog,
		isLoading,
		isError,
		error,
	} = BlogApi.GetById.useQuery(id, {
		enabled: Boolean(id),
	});

	if (!id) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-blue-50">
					<div className="text-sm text-red-600 font-semibold">Missing blog id.</div>
					<div className="mt-3">
						<Link href="/blogs" className="text-blue-600 font-semibold underline">
							Back to list
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="h-64 flex items-center justify-center">
					<Loader2 className="animate-spin text-blue-600 w-10 h-10" />
				</div>
			</div>
		);
	}

	if (isError || !blog) {
		const message =
			(error as { response?: { data?: { message?: string } } })?.response?.data
				?.message || "Blog not found.";

		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
				<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-blue-50">
					<div className="text-center text-red-600 font-bold">{message}</div>
					<div className="mt-4 flex justify-center">
						<Link href="/blogs" className="text-blue-600 font-semibold underline">
							Back to list
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const status = normalizeStatus(blog.status);

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8 space-y-6">
			<div className="px-4 flex flex-col gap-2">
				<div className="flex items-center justify-between gap-3">
					<button
						onClick={() => router.back()}
						className="text-blue-600 text-sm font-bold inline-flex items-center gap-1 hover:underline"
						type="button"
					>
						<ArrowLeft size={14} /> Back to List
					</button>
					<Badge
						className={cn(
							"rounded-md px-3 py-1 text-[10px] font-bold border-none shadow-none",
							statusBadgeClass(status)
						)}
					>
						{status || "-"}
					</Badge>
				</div>

				<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
					{blog.title}
				</h1>
			</div>

			<Card className="rounded-3xl md:rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
				<CardContent className="p-6 md:p-10 space-y-10">
					<div className="space-y-2">
						<h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
							<FileText className="text-blue-600 w-5 h-5" /> Title
						</h3>
						<p className="text-gray-600 text-base leading-relaxed pl-7">
							{blog.title}
						</p>
					</div>

					<div className="space-y-2">
						<h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
							<User className="text-blue-600 w-5 h-5" /> Author
						</h3>
						<p className="text-gray-600 text-base font-semibold pl-7">
							{blog.advisor?.fullName || "Unknown Advisor"}
						</p>
					</div>

					<div className="space-y-4 pt-4 border-t border-gray-50">
						<h3 className="text-gray-900 font-bold text-lg">Description</h3>
						<div
							className="text-gray-700 leading-relaxed text-base md:text-lg max-w-4xl prose prose-slate"
							dangerouslySetInnerHTML={{ __html: blog.description ?? "" }}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
