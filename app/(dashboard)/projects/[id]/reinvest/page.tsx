"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DetailPageSkeleton } from "@/components/shared/page-skeletons";

import api from "@/lib/api";
import type { BankType } from "@/lib/api/investment";
import { reinvestSchema, type ReinvestData } from "@/lib/validator";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function toId(value: string | string[] | undefined) {
	if (!value) return "";
	return Array.isArray(value) ? value[0] ?? "" : value;
}

function parseAmount(value?: string | number | null) {
	if (value == null || value === "") return 0;
	const parsed = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
	return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrencyETB(amount: number) {
	return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(amount);
}

function getInvestorBalance(inv: BankType) {
	return inv.balance ?? 0;
}

function isZeroBalance(balance: number) {
	return balance <= 0;
}

export default function ReinvestPage() {
	const params = useParams();
	const router = useRouter();
	const id = toId((params as Record<string, string | string[] | undefined>)?.id);

	const [search, setSearch] = useState("");
	const [allocations, setAllocations] = useState<Record<string, number>>({});
	const [allocationErrors, setAllocationErrors] = useState<Record<string, string>>({});
	const [selectedInvestorIds, setSelectedInvestorIds] = useState<Set<string>>(
		() => new Set()
	);

	const { data: project, isLoading: isProjectLoading } =
		api.Project.GetById.useQuery(id);
	const { data: bank, isLoading: isBankLoading } =
		api.Investment.GetBank.useQuery();
	const { mutate: performReinvest, isPending } =
		api.Investment.ReInvest.useMutation({
			onSuccess: () => {
				router.back();
			},
		});

	const investors = useMemo(() => {
		return (bank ?? []).filter((b) => b.role === "INVESTOR");
	}, [bank]);

	const balanceById = useMemo(() => {
		const map = new Map<string, number>();
		for (const inv of investors) {
			map.set(inv._id, getInvestorBalance(inv));
		}
		return map;
	}, [investors]);

	const visibleInvestors = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return investors;
		return investors.filter((inv) => inv.fullName.toLowerCase().includes(q));
	}, [investors, search]);

	const selectedCount = selectedInvestorIds.size;

	const totalAllocationSum = useMemo(() => {
		let sum = 0;
		for (const investorId of selectedInvestorIds) {
			sum += allocations[investorId] ?? 0;
		}
		return sum;
	}, [selectedInvestorIds, allocations]);

	const remainingGoal = useMemo(() => {
		const goal = parseAmount(project?.fundingGoal);
		return goal - totalAllocationSum;
	}, [project?.fundingGoal, totalAllocationSum]);

	const canConfirmAllocation = useMemo(() => {
		if (selectedInvestorIds.size === 0) return false;
		for (const investorId of selectedInvestorIds) {
			const amount = allocations[investorId] ?? 0;
			if (amount <= 0) return false;
			const balance = balanceById.get(investorId) ?? 0;
			if (amount > balance) return false;
		}
		return true;
	}, [selectedInvestorIds, allocations, balanceById]);

	const handleConfirmAllocation = () => {
		const payload: ReinvestData = {
			projectId: id,
			investments: [...selectedInvestorIds]
				.map((investorId) => ({
					investorId,
					amount: allocations[investorId] ?? 0,
				}))
				.filter((i) => i.amount > 0),
		};

		if (payload.investments.length === 0) {
			toast.error("Select at least one investor and enter an amount");
			return;
		}

		const parsed = reinvestSchema.safeParse(payload);
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "Invalid allocation data");
			return;
		}

		performReinvest(parsed.data);
	};

	const toggleInvestor = (investorId: string, balance: number, checked: boolean) => {
		if (isZeroBalance(balance)) return;

		setSelectedInvestorIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(investorId);
			else next.delete(investorId);
			return next;
		});

		if (!checked) {
			setAllocations((prev) => ({ ...prev, [investorId]: 0 }));
			setAllocationErrors((prev) => {
				const next = { ...prev };
				delete next[investorId];
				return next;
			});
		}
	};

	const handleAmountChange = (
		investorId: string,
		balance: number,
		rawValue: string
	) => {
		if (rawValue === "" || rawValue === null || rawValue === undefined) {
			setAllocations((prev) => ({ ...prev, [investorId]: 0 }));
			setAllocationErrors((prev) => {
				const next = { ...prev };
				delete next[investorId];
				return next;
			});
			return;
		}

		const parsed = Number(rawValue);
		if (!Number.isFinite(parsed)) return;

		if (parsed > balance) {
			setAllocationErrors((prev) => ({
				...prev,
				[investorId]: "Exceeds available balance",
			}));
			setAllocations((prev) => ({ ...prev, [investorId]: balance }));
			return;
		}

		setAllocationErrors((prev) => {
			const next = { ...prev };
			delete next[investorId];
			return next;
		});
		setAllocations((prev) => ({
			...prev,
			[investorId]: Math.max(0, parsed),
		}));
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
		<div className="space-y-6 font-sans">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4">
				<div className="space-y-1">
					<button
						onClick={() => router.back()}
						className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline"
						type="button"
					>
						<ArrowLeft size={14} /> Back to Project
					</button>
					<h1 className="text-[28px] font-bold text-slate-900">Reinvest Funds</h1>
					<p className="text-slate-500 font-medium">Project: {project?.projectName}</p>
				</div>

				<Button
					type="button"
					onClick={handleConfirmAllocation}
					className="bg-blue-600 hover:bg-blue-700 h-12 px-10 rounded-xl font-bold shadow-lg"
					disabled={isPending || !canConfirmAllocation}
				>
					{isPending ? "Processing..." : "Confirm Allocation"}
				</Button>
			</div>

			<div className="bg-white rounded-[2.5rem] p-4 sm:p-8 shadow-sm border border-blue-50">
				<div className="bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm text-slate-900 p-5 rounded-2xl mb-6 font-sans">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Active Allocations
							</p>
							<p className="mt-1 text-sm font-semibold text-slate-900">
								Selected Investors: {selectedCount}
							</p>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Total Committed Capital
							</p>
							<p className="mt-1 text-sm font-semibold text-slate-900">
								Total Allocation: {formatCurrencyETB(totalAllocationSum)}
							</p>
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Remaining Target Goal
							</p>
							<p
								className={cn(
									"mt-1 text-sm font-semibold",
									remainingGoal > 0 ? "text-[#22C55E]" : "text-slate-600"
								)}
							>
								Remaining Project Goal: {formatCurrencyETB(remainingGoal)}
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
					<div className="relative w-full sm:max-w-sm">
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Search Investors..."
							className="pl-11 h-12 rounded-xl border border-slate-200 bg-white text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:border-slate-400"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
					<div className="text-sm font-bold text-slate-400">
						Found {investors.length} Investors
					</div>
				</div>

				<div className="rounded-2xl border border-gray-100 overflow-hidden">
					<Table>
						<TableHeader className="bg-[#D6E6F2]">
							<TableRow className="border-none">
								<TableHead className="font-bold text-slate-700 h-14 px-4 sm:px-8 w-16">
									Select
								</TableHead>
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
							{visibleInvestors.map((inv) => {
								const balance = getInvestorBalance(inv);
								const zeroBalance = isZeroBalance(balance);
								const isSelected = selectedInvestorIds.has(inv._id);
								const amount = allocations[inv._id] ?? 0;
								const error = allocationErrors[inv._id];

								return (
									<TableRow
										key={inv._id}
										className={cn(
											"hover:bg-slate-50/50 border-gray-50",
											zeroBalance && "opacity-50"
										)}
									>
										<TableCell className="px-4 sm:px-8 py-5">
											<Checkbox
												className="size-5 border-2 border-slate-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
												checked={isSelected}
												disabled={zeroBalance}
												onCheckedChange={(v) =>
													toggleInvestor(inv._id, balance, Boolean(v))
												}
												aria-label={`Select ${inv.fullName}`}
											/>
										</TableCell>
										<TableCell className="px-4 sm:px-8 py-5 font-bold text-slate-900">
											{inv.fullName}
										</TableCell>
										<TableCell className="px-4 sm:px-8 py-5 font-medium text-slate-500">
											{zeroBalance ? (
												<div className="flex flex-col">
													<span className="text-slate-400">{formatCurrencyETB(0)}</span>
													<span className="text-[10px] text-red-500 font-medium mt-1">
														Insufficient funds
													</span>
												</div>
											) : (
												formatCurrencyETB(balance)
											)}
										</TableCell>
										<TableCell className="px-4 sm:px-8 py-5">
											{zeroBalance ? (
												<span className="text-xs text-slate-400 italic">
													Locked (No funds)
												</span>
											) : (
												<>
													<div className="relative flex items-center max-w-xs">
														<span className="absolute left-3 text-xs font-semibold text-slate-500 pointer-events-none">
															ETB
														</span>
														<Input
															type="number"
															placeholder="0.00"
															value={
																isSelected
																	? amount > 0
																		? amount
																		: ""
																	: ""
															}
															onChange={(e) =>
																handleAmountChange(inv._id, balance, e.target.value)
															}
															className="h-11 rounded-lg border border-slate-200 bg-white pl-12 pr-3 text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
															min={0}
															max={balance}
															disabled={!isSelected}
														/>
													</div>
													{error ? (
														<p className="text-xs text-red-600 mt-1">{error}</p>
													) : null}
												</>
											)}
										</TableCell>
									</TableRow>
								);
							})}
							{visibleInvestors.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={4}
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
