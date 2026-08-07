"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { hasAllAccessPermission, normalizePermissions } from "@/lib/access";
import TraineeAuth, { type BulkTraineeImportEntry } from "@/lib/api/trainee";
import { downloadTextFile } from "@/lib/downloadTextFile";
import { ETHIOPIA_REGIONS } from "@/lib/ethiopia-regions";
import { saveLastImportResult } from "@/lib/importResultStorage";
import useAuthStore from "@/store/useAuthStore";

const TEMPLATE_HEADERS = ["firstname", "middlename", "lastname", "email", "phoneNumber", "age", "gender", "region"];

const TEMPLATE_EXAMPLE_ROW = ["Dawit", "Girma", "Bekele", "dawit.bekele@example.com", "0911223344", "25", "male", "Amhara"];

const MAX_TRAINEES_PER_IMPORT = 100;
const REQUIRED_HEADERS = ["firstname", "middlename", "lastname", "email", "phoneNumber", "age", "gender", "region"];
const VALID_GENDERS = ["male", "female"];
const REGION_BY_LOWERCASE = new Map(ETHIOPIA_REGIONS.map((region) => [region.toLowerCase(), region]));
const MAX_DISPLAYED_ROW_ERRORS = 10;

const HEADER_ALIASES: Record<string, string> = {
	firstname: "firstname",
	middlename: "middlename",
	lastname: "lastname",
	email: "email",
	phonenumber: "phoneNumber",
	age: "age",
	gender: "gender",
	region: "region",
};

function normalizeHeader(header: string): string {
	return header.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function downloadCsvTemplate() {
	const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_EXAMPLE_ROW.join(",")].join("\n");
	downloadTextFile("trainee-bulk-import-template.csv", csv, "text/csv");
}

function parseCsvLine(line: string): string[] {
	const cells: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (inQuotes) {
			if (char === '"') {
				if (line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			cells.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	cells.push(current);
	return cells.map((cell) => cell.trim());
}

function parseTraineesCsv(text: string): { trainees: BulkTraineeImportEntry[]; error?: string } {
	const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length < 2) {
		return { trainees: [], error: "CSV must include a header row and at least one trainee." };
	}

	const rawHeaders = parseCsvLine(lines[0]);
	const headers = rawHeaders.map((header) => HEADER_ALIASES[normalizeHeader(header)]);
	const missingRequired = REQUIRED_HEADERS.filter((field) => !headers.includes(field));
	if (missingRequired.length > 0) {
		return {
			trainees: [],
			error: `CSV is missing required column(s): ${missingRequired.join(", ")}`,
		};
	}

	const rows = lines.slice(1);
	if (rows.length > MAX_TRAINEES_PER_IMPORT) {
		return {
			trainees: [],
			error: `CSV has ${rows.length} rows; a maximum of ${MAX_TRAINEES_PER_IMPORT} trainees can be imported per upload.`,
		};
	}

	const rowErrors: string[] = [];

	const trainees = rows.map((line, rowIndex) => {
		const cells = parseCsvLine(line);
		const row: Record<string, string> = {};
		headers.forEach((header, index) => {
			if (!header) return; // unrecognized column, ignore
			row[header] = cells[index] ?? "";
		});

		const rowNumber = rowIndex + 2; // +1 for header row, +1 for 1-based index
		const missing = REQUIRED_HEADERS.filter((field) => !row[field]?.trim());
		if (missing.length > 0) {
			rowErrors.push(`Row ${rowNumber}: missing ${missing.join(", ")}`);
		}

		const age = Number(row.age);
		if (row.age && (!Number.isInteger(age) || age <= 0)) {
			rowErrors.push(`Row ${rowNumber}: age must be a positive whole number`);
		}

		const gender = row.gender?.trim().toLowerCase();
		if (row.gender && !VALID_GENDERS.includes(gender)) {
			rowErrors.push(`Row ${rowNumber}: gender must be "male" or "female"`);
		}

		const region = REGION_BY_LOWERCASE.get(row.region?.trim().toLowerCase());
		if (row.region && !region) {
			rowErrors.push(`Row ${rowNumber}: "${row.region}" is not a valid region`);
		}

		const entry: BulkTraineeImportEntry = {
			firstname: row.firstname,
			middlename: row.middlename,
			lastname: row.lastname,
			email: row.email,
			phoneNumber: row.phoneNumber,
			age,
			gender,
			region: region ?? row.region,
		};

		return entry;
	});

	if (rowErrors.length > 0) {
		const shown = rowErrors.slice(0, MAX_DISPLAYED_ROW_ERRORS);
		const suffix =
			rowErrors.length > MAX_DISPLAYED_ROW_ERRORS
				? ` (+${rowErrors.length - MAX_DISPLAYED_ROW_ERRORS} more)`
				: "";
		return { trainees: [], error: shown.join(" | ") + suffix };
	}

	return { trainees };
}

interface BulkImportTraineesModalProps {
	/** Pass to control the dialog from a parent (e.g. a menu item) instead of the built-in button. */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function BulkImportTraineesModal({
	open: openProp,
	onOpenChange: onOpenChangeProp,
}: BulkImportTraineesModalProps = {}) {
	const router = useRouter();
	const isControlled = openProp !== undefined;
	const [internalOpen, setInternalOpen] = useState(false);
	const open = isControlled ? openProp : internalOpen;
	const setOpen = isControlled ? (onOpenChangeProp ?? (() => {})) : setInternalOpen;
	const [fileName, setFileName] = useState<string | null>(null);
	const [trainees, setTrainees] = useState<BulkTraineeImportEntry[]>([]);
	const [parseError, setParseError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const permissions = useAuthStore((s) => s.permissions);
	const canBulkImport =
		hasAllAccessPermission(permissions) || normalizePermissions(permissions).includes("trainee.write");

	const resetFileState = () => {
		setFileName(null);
		setTrainees([]);
		setParseError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const { mutate, isPending } = TraineeAuth.bulkImportTrainees.useMutation({
		onResult: (data) => {
			saveLastImportResult(data);
		},
		onViewDetails: () => {
			router.push("/trainee/list/import-result");
		},
		onSuccess: () => {
			resetFileState();
			setOpen(false);
		},
	});

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setFileName(file.name);
		setParseError(null);
		setTrainees([]);

		const reader = new FileReader();
		reader.onload = () => {
			const { trainees: parsed, error } = parseTraineesCsv(String(reader.result ?? ""));
			if (error) {
				setParseError(error);
				return;
			}
			setTrainees(parsed);
		};
		reader.readAsText(file);
	};

	const handleSubmit = () => {
		if (trainees.length === 0) {
			toast.error("Choose a valid CSV file first");
			return;
		}
		mutate({ trainees });
	};

	if (!canBulkImport) return null;

	return (
		<>
			{!isControlled && (
				<Button
					variant="outline"
					className="rounded-xl px-6 font-bold border-blue-500 text-blue-600 hover:bg-blue-50"
					onClick={() => setOpen(true)}
				>
					<Upload className="h-4 w-4 mr-2" />
					Bulk Import
				</Button>
			)}

			<Dialog
				open={open}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) resetFileState();
				}}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold text-slate-900">
							Bulk Import Trainees
						</DialogTitle>
						<DialogDescription>
							Upload a CSV file to create up to {MAX_TRAINEES_PER_IMPORT} trainees at once.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<Button
							type="button"
							variant="outline"
							className="rounded-xl font-semibold w-full"
							onClick={downloadCsvTemplate}
						>
							<Download className="h-4 w-4 mr-2" />
							Download CSV Template
						</Button>

						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={handleFileChange}
						/>
						<Button
							type="button"
							variant="outline"
							className="rounded-xl font-semibold w-full"
							onClick={() => fileInputRef.current?.click()}
						>
							{fileName ?? "Choose CSV File"}
						</Button>

						{parseError && <p className="text-sm text-red-600">{parseError}</p>}
						{!parseError && trainees.length > 0 && (
							<p className="text-sm text-emerald-600">
								{trainees.length} trainee(s) ready to import.
							</p>
						)}
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={trainees.length === 0 || isPending}
							className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold"
						>
							{isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Importing...
								</>
							) : (
								`Import ${trainees.length || ""} Trainee(s)`
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
