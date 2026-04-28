"use client";

import Link from "next/link";
import { Briefcase, ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 md:p-8">
			<div className="mx-auto max-w-4xl space-y-6">
				<div className="rounded-3xl border border-blue-50 bg-white p-6 shadow-sm md:p-10">
					<div className="flex items-start gap-4">
						<div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
							<Briefcase className="h-6 w-6" />
						</div>
						<div className="space-y-2">
							<p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
								Jobs
							</p>
							<h1 className="text-2xl font-bold text-gray-900">Jobs workspace</h1>
							<p className="max-w-2xl text-sm text-gray-600">
								This route is now available for users with job permissions. The detailed
								jobs workflow can be wired in here without breaking navigation.
							</p>
						</div>
					</div>

					<div className="mt-8 grid gap-4 sm:grid-cols-2">
						<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<ClipboardList className="h-4 w-4" />
								Navigation restored
							</div>
							<p className="mt-2 text-sm text-slate-600">
								Users with job access no longer hit a 404 when opening this section.
							</p>
						</div>
						<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
								<ArrowLeft className="h-4 w-4" />
								Next step
							</div>
							<p className="mt-2 text-sm text-slate-600">
								Connect the real job list or application flow when the backend route is
								ready.
							</p>
						</div>
					</div>

					<div className="mt-8 flex gap-3">
						<Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
							<Link href="/dashboard">Back to Dashboard</Link>
						</Button>
						<Button asChild variant="outline" className="rounded-xl">
							<Link href="/opportunity">Open Opportunities</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}