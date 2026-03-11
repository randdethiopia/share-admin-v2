import Link from "next/link";
import { Eye, Plus, UserCheck, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type TraineeRow = {
	id: string;
	name: string;
	phone: string;
	email: string;
	status: "ACTIVE" | "INACTIVE";
};

const MOCK_TRAINEES: TraineeRow[] = [
	{
		id: "trainee-001",
		name: "Abel Worku",
		phone: "+251-911-220-331",
		email: "abel.worku@share.local",
		status: "ACTIVE",
	},
	{
		id: "trainee-002",
		name: "Meron Hailu",
		phone: "+251-922-110-442",
		email: "meron.hailu@share.local",
		status: "INACTIVE",
	},
	{
		id: "trainee-003",
		name: "Yonas Fikru",
		phone: "+251-933-340-228",
		email: "yonas.fikru@share.local",
		status: "ACTIVE",
	},
	{
		id: "trainee-004",
		name: "Rahel Assefa",
		phone: "+251-944-512-178",
		email: "rahel.assefa@share.local",
		status: "ACTIVE",
	},
];

export default function CoordinatorMyTraineesPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-[28px] font-bold tracking-tight text-black">
						My Trainees
					</h1>
					<p className="font-medium text-zinc-500">See all your trainees</p>
				</div>
				<Button
					asChild
					className="h-11 rounded-xl bg-[#3B82F6] px-6 font-bold text-white shadow-md hover:bg-blue-600"
				>
					<Link href="/coordinator/my-trainees/new">
						<Plus className="mr-1 h-5 w-5" /> New Trainee
					</Link>
				</Button>
			</div>

			<div className="rounded-[2.5rem] border border-blue-50 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
				<div className="mb-6 text-xs font-bold text-gray-400">
					Total: {MOCK_TRAINEES.length} Trainees
				</div>

				<div className="overflow-x-auto rounded-2xl border border-gray-100">
					<Table className="min-w-180">
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none hover:bg-transparent">
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Name
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Phone
								</TableHead>
								<TableHead className="h-12 px-6 text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Email
								</TableHead>
								<TableHead className="h-12 px-6 text-right text-[11px] font-bold uppercase tracking-wider text-[#4A5568] sm:px-8">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{MOCK_TRAINEES.map((trainee) => (
								<TableRow
									key={trainee.id}
									className="border-gray-50 hover:bg-slate-50/50"
								>
									<TableCell className="px-6 py-5 font-bold text-gray-700 sm:px-8">
										{trainee.name}
									</TableCell>
									<TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
										{trainee.phone}
									</TableCell>
									<TableCell className="px-6 py-5 text-sm font-medium text-gray-500 sm:px-8">
										{trainee.email}
									</TableCell>
									<TableCell className="px-6 py-5 sm:px-8">
										<div className="flex items-center justify-end gap-2">
											<Link
												href={`/coordinator/my-trainees/${trainee.id}`}
												className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
											>
												<Eye size={16} />
											</Link>
											<button
												type="button"
												className={
													trainee.status === "INACTIVE"
														? "inline-flex h-8 w-24 items-center justify-center gap-1 rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
														: "inline-flex h-8 w-24 items-center justify-center gap-1 rounded-lg bg-red-50 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-100"
												}
											>
												{trainee.status === "INACTIVE" ? <UserCheck size={14} /> : <UserX size={14} />}
												{trainee.status === "INACTIVE" ? "Activate" : "Deactivate"}
											</button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
