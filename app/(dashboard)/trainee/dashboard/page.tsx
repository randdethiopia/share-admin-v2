"use client";

import Link from "next/link";
import { BarChart3, List, ListPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const shortcuts = [
	{ href: "/trainee/list", label: "Open trainee list", icon: List },
	{ href: "/trainee/wait-list", label: "Review wait-list", icon: Users },
	{ href: "/trainee/list/create-trainee", label: "Create trainee", icon: ListPlus },
];

export default function TraineeDashboardPage() {
	return (
		<div className="bg-[#E2EDF8]">
			<div className="mx-auto max-w-5xl space-y-6">
				<div className="rounded-3xl border border-blue-50 bg-white p-6 shadow-sm md:p-10">
					<div className="flex items-start gap-4">
						<div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
							<BarChart3 className="h-6 w-6" />
						</div>
						<div className="space-y-2">
							<p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
								Trainee
							</p>
							<h1 className="text-2xl font-bold text-gray-900">Trainee dashboard</h1>
							<p className="max-w-2xl text-sm text-gray-600">
								Use this area to jump into the trainee list, wait-list, and creation flow
								without hitting a missing route.
							</p>
						</div>
					</div>

					<div className="mt-8 grid gap-4 sm:grid-cols-3">
						{shortcuts.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
								>
									<Icon className="h-5 w-5 text-slate-700 transition group-hover:text-blue-600" />
									<p className="mt-3 text-sm font-semibold text-slate-900">{item.label}</p>
								</Link>
							);
						})}
					</div>

					<div className="mt-8 flex flex-wrap gap-3">
						<Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
							<Link href="/trainee/list">Open list</Link>
						</Button>
						<Button asChild variant="outline" className="rounded-xl">
							<Link href="/dashboard">Back to Dashboard</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}