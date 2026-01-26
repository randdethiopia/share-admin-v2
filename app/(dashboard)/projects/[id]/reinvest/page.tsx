
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

import ProjectApi from "@/api/project";
import InvestmentApi from "@/api/investment";
import { reinvestSchema, type ReinvestData } from "@/lib/validator";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";

function toId(value: string | string[] | undefined) {
	if (!value) return "";
	return Array.isArray(value) ? value[0] ?? "" : value;
}

export default function ReinvestPage() {
	const params = useParams();
	const router = useRouter();
	const id = toId((params as Record<string, string | string[] | undefined>)?.id);

	const [search, setSearch] = useState("");
	const { data: project, isLoading: isProjectLoading } =
		ProjectApi.GetById.useQuery(id);
	const { data: bank, isLoading: isBankLoading } =
		InvestmentApi.GetBank.useQuery();
	const { mutate: performReinvest, isPending } =
		InvestmentApi.ReInvest.useMutation({
			onSuccess: () => {
				router.back();
			},
		});

	const investors = useMemo(() => {
		const list = (bank ?? []).filter((b) => b.role === "INVESTOR");
		return list;
	}, [bank]);

	const visibleInvestors = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return investors.map((inv, index) => ({ inv, index }));
		return investors
			.map((inv, index) => ({ inv, index }))
			.filter(({ inv }) => inv.fullName.toLowerCase().includes(q));
	}, [investors, search]);
	const form = useForm<ReinvestData>({
		resolver: zodResolver(reinvestSchema),
		defaultValues: {
			projectId: id,
			investments: [],
		},
		mode: "onChange",
	});

	useEffect(() => {
		if (!id) return;
		const existing = form.getValues("investments");
		if (existing.length === investors.length && existing.length > 0) return;

		form.reset({
			projectId: id,
			investments: investors.map((inv) => ({
				investorId: inv._id,
				amount: 0,
			})),
		});
	}, [id, investors, form]);

	const onSubmit = (data: ReinvestData) => {
		const payload: ReinvestData = {
			projectId: id,
			investments: data.investments.filter((i) => (i?.amount ?? 0) > 0),
		};
		performReinvest(payload);
	};

	if (!id) {
		return (
			<div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
				Invalid project id
			</div>
		);
	}

	if (isBankLoading || isProjectLoading) {
		return <DetailPageSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4">
				<div className="space-y-1">
					<button
						onClick={() => router.back()}
						className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline"
						type="button"
					>
						<ArrowLeft size={14} /> Back to Project
					</button>
					<h1 className="text-[28px] font-bold text-black">Reinvest Funds</h1>
					<p className="text-zinc-500 font-medium">Project: {project?.projectName}</p>
				</div>

				<form onSubmit={form.handleSubmit(onSubmit)}>
					<Button
						type="submit"
						className="bg-blue-600 hover:bg-blue-700 h-12 px-10 rounded-xl font-bold shadow-lg"
						disabled={isPending}
					>
						{isPending ? "Processing..." : "Confirm Allocation"}
					</Button>
				</form>
			</div>


			<div className="bg-white rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-blue-50">
				
				<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
					<div className="relative w-full sm:max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search Investors..."
							className="pl-11 bg-[#F3F8FF] border-none h-12 rounded-xl"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div className="text-sm font-bold text-gray-400">
						Found {investors.length} Investors
					</div>
				</div>

				<div className="rounded-2xl border border-gray-100 overflow-hidden">
					<Table>
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none">
								<TableHead className="font-bold text-slate-700 h-14 px-4 sm:px-8">
									Investor Name
								</TableHead>
								<TableHead className="font-bold text-slate-700 h-14 px-4 sm:px-8">
									Current Balance
								</TableHead>
								<TableHead className="font-bold text-slate-700 h-14 px-4 sm:px-8 w-50">
									Reinvest Amount
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleInvestors.map(({ inv, index }) => (
								<TableRow
									key={inv._id}
									className="hover:bg-slate-50/50 border-gray-50"
								>
									<TableCell className="px-4 sm:px-8 py-5 font-bold text-slate-900">
										{inv.fullName}
									</TableCell>
									<TableCell className="px-4 sm:px-8 py-5 font-medium text-slate-500">
										{new Intl.NumberFormat("en-ET", {
											style: "currency",
											currency: "ETB",
										}).format(inv.balance)}
									</TableCell>
									<TableCell className="px-4 sm:px-8 py-5">
										<Input
											type="number"
											placeholder="0.00"
											className="bg-[#F3F8FF] border-none h-11 rounded-lg focus-visible:ring-blue-500"
											{...form.register(`investments.${index}.amount`, {
												valueAsNumber: true,
											})}
											max={inv.balance}
											min={0}
										/>
										
										<input
											type="hidden"
											{...form.register(`investments.${index}.investorId`)}
											defaultValue={inv._id}
										/>
									</TableCell>
								</TableRow>
							))}
							{visibleInvestors.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={3}
										className="px-4 sm:px-8 py-10 text-center text-sm text-muted-foreground"
									>
										No investors found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
