"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BulkTraineeImportFailure, BulkTraineeImportResType } from "@/lib/api/trainee";
import { downloadTextFile } from "@/lib/downloadTextFile";
import { IMPORT_RESULT_UPDATED_EVENT, readLastImportResult } from "@/lib/importResultStorage";
import { BulkImportTraineesModal } from "../../components/bulk-import-trainees-modal";

function csvCell(value: string) {
	return `"${value.replace(/"/g, '""')}"`;
}

function failedTraineeName(f: BulkTraineeImportFailure) {
	return `${f.data.firstname} ${f.data.lastname}`;
}

function failedTraineesToCsv(failed: BulkTraineeImportFailure[]): string {
	const headers = ["firstname", "lastname", "email", "phoneNumber", "age", "gender", "region", "reason"];
	const rows = failed.map((f) =>
		[
			f.data.firstname,
			f.data.lastname,
			f.data.email ?? "",
			f.data.phoneNumber,
			f.data.age != null ? String(f.data.age) : "",
			f.data.gender ?? "",
			f.data.region ?? "",
			f.reason,
		]
			.map(csvCell)
			.join(",")
	);
	return [headers.join(","), ...rows].join("\n");
}

export default function ImportResultPage() {
	const router = useRouter();
	const [results, setResults] = useState<BulkTraineeImportResType["data"] | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		setResults(readLastImportResult());
		setLoaded(true);

		const handleUpdated = () => setResults(readLastImportResult());
		window.addEventListener(IMPORT_RESULT_UPDATED_EVENT, handleUpdated);
		return () => window.removeEventListener(IMPORT_RESULT_UPDATED_EVENT, handleUpdated);
	}, []);

	const handleExportFailed = () => {
		if (!results || results.failedTrainees.length === 0) return;
		downloadTextFile(
			`trainee-bulk-import-failed-${results.totalFailed}.csv`,
			failedTraineesToCsv(results.failedTrainees),
			"text/csv"
		);
	};

	if (loaded && !results) {
		return (
			<div className="min-h-screen bg-[#E2EDF8] p-4 sm:p-6 md:p-8">
				<div className="max-w-4xl mx-auto space-y-6">
					<Button
						type="button"
						variant="ghost"
						className="inline-flex items-center gap-2 px-0 text-blue-600 hover:bg-transparent hover:text-blue-700"
						onClick={() => router.push("/trainee/list")}
					>
						<ArrowLeft size={16} /> Back to Trainees
					</Button>
					<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-sm border border-blue-50 text-center space-y-4">
						<p className="text-zinc-600">No import results found on this browser yet.</p>
						<Button onClick={() => router.push("/trainee/list")} className="rounded-xl font-bold">
							Back to Trainees
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#E2EDF8] p-4 sm:p-6 md:p-8">
			<div className="max-w-5xl mx-auto space-y-6">
				<Button
					type="button"
					variant="ghost"
					className="inline-flex items-center gap-2 px-0 text-blue-600 hover:bg-transparent hover:text-blue-700"
					onClick={() => router.push("/trainee/list")}
				>
					<ArrowLeft size={16} /> Back to Trainees
				</Button>

				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
					<div className="space-y-1">
						<h1 className="text-2xl md:text-[28px] font-bold text-black tracking-tight">
							Bulk Import Result
						</h1>
						{results && (
							<p className="text-zinc-600 text-sm font-medium">
								{results.totalSuccess} succeeded, {results.totalFailed} failed out of{" "}
								{results.totalProcessed} processed.
							</p>
						)}
					</div>
					<BulkImportTraineesModal />
				</div>

				{results && (
					<div className="bg-white rounded-3xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-sm border border-blue-50">
						<Tabs defaultValue="added" className="w-full space-y-4">
							<TabsList>
								<TabsTrigger value="added">Added ({results.successTrainees.length})</TabsTrigger>
								<TabsTrigger value="failed">Failed ({results.failedTrainees.length})</TabsTrigger>
							</TabsList>

							<TabsContent value="added" className="mt-0">
								<div className="rounded-xl border border-emerald-100 max-h-96 overflow-y-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Name</TableHead>
												<TableHead>Phone</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{results.successTrainees.map((t) => (
												<TableRow key={t.id}>
													<TableCell className="font-medium">{t.name}</TableCell>
													<TableCell className="text-zinc-500">{t.phone}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</TabsContent>

							<TabsContent value="failed" className="mt-0 space-y-3">
								<div className="flex items-center justify-end">
									<Button
										variant="outline"
										size="sm"
										onClick={handleExportFailed}
										className="rounded-lg font-semibold"
									>
										<Download className="h-4 w-4 mr-2" />
										Export Failed Rows
									</Button>
								</div>
								<p className="text-xs text-zinc-500">
									Fix the issues below in the exported CSV, then use Bulk Import to re-upload just
									these rows — trainees already added won&apos;t be duplicated.
								</p>
								<div className="rounded-xl border border-red-100 max-h-96 overflow-y-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Name</TableHead>
												<TableHead>Phone</TableHead>
												<TableHead>Reason</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{results.failedTrainees.map((f, i) => (
												<TableRow key={i}>
													<TableCell className="font-medium">{failedTraineeName(f)}</TableCell>
													<TableCell className="text-zinc-500">{f.data.phoneNumber}</TableCell>
													<TableCell className="text-red-600">{f.reason}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				)}
			</div>
		</div>
	);
}
