"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	type CorrectionRow,
	getCorrections,
	type PaginatedCorrections,
} from "@/app/actions/metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const SECTION_NAMES: Record<string, string> = {
	header: "Header",
	sectionA: "A — Member",
	sectionB: "B — Provider",
	sectionC: "C — Referring",
	sectionD: "D — Service",
	sectionE: "E — Clinical",
	sectionF: "F — Justification",
	sectionG: "G — Attestation",
};

const FIELD_LABELS: Record<string, string> = {
	payer: "Payer",
	dateOfRequest: "Date of Request",
	payerFax: "Payer Fax",
	payerPhone: "Payer Phone",
	name: "Name",
	dob: "Date of Birth",
	gender: "Gender",
	memberId: "Member ID",
	groupNumber: "Group Number",
	phone: "Phone",
	address: "Address",
	npi: "NPI",
	facility: "Facility",
	taxId: "Tax ID",
	fax: "Fax",
	serviceType: "Service Type",
	serviceSetting: "Service Setting",
	cptCodes: "CPT Codes",
	icd10Codes: "ICD-10 Codes",
	diagnosisDescriptions: "Diagnosis Descriptions",
	startDate: "Start Date",
	endDate: "End Date",
	sessions: "Sessions",
	frequency: "Frequency",
	symptoms: "Symptoms",
	clinicalHistory: "Clinical History",
	medications: "Medications",
	assessmentScores: "Assessment Scores",
	treatmentGoals: "Treatment Goals",
	medicalNecessity: "Medical Necessity",
	riskIfDenied: "Risk if Denied",
	providerSignature: "Provider Signature",
	printedName: "Printed Name",
	date: "Date",
	licenseNumber: "License Number",
};

export function RecentCorrectionsTable() {
	const [data, setData] = useState<PaginatedCorrections | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchPage = useCallback(async (page: number) => {
		setIsLoading(true);
		try {
			const result = await getCorrections(page);
			setData(result);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPage(1);
	}, [fetchPage]);

	if (!data && isLoading) {
		return (
			<p className="py-8 text-center text-sm text-muted-foreground">
				Loading corrections...
			</p>
		);
	}

	if (!data || data.total === 0) {
		return (
			<p className="py-4 text-center text-sm text-muted-foreground">
				No corrections recorded yet
			</p>
		);
	}

	const { rows, page, pageCount, total } = data;
	const startItem = (page - 1) * data.pageSize + 1;
	const endItem = Math.min(page * data.pageSize, total);

	return (
		<div>
			<div
				className={`overflow-x-auto ${isLoading ? "pointer-events-none opacity-60" : ""}`}
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="hidden md:table-cell">Case</TableHead>
							<TableHead>Field</TableHead>
							<TableHead>Original</TableHead>
							<TableHead>Corrected</TableHead>
							<TableHead className="hidden sm:table-cell">Section</TableHead>
							<TableHead className="hidden md:table-cell">Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((c: CorrectionRow, i: number) => (
							<TableRow key={`${c.caseId}-${c.field}-${i}`}>
								<TableCell className="hidden font-mono text-xs md:table-cell">
									#{c.caseId.slice(0, 8)}
								</TableCell>
								<TableCell className="text-sm">
									{FIELD_LABELS[c.field] ?? c.field}
								</TableCell>
								<TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
									{c.originalValue || "—"}
								</TableCell>
								<TableCell className="max-w-[120px] truncate text-xs">
									{c.correctedValue}
								</TableCell>
								<TableCell className="hidden sm:table-cell">
									<Badge variant="secondary" className="text-xs">
										{SECTION_NAMES[c.section] ?? c.section}
									</Badge>
								</TableCell>
								<TableCell className="hidden text-xs text-muted-foreground md:table-cell">
									{new Date(c.date).toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{pageCount > 1 && (
				<div className="flex items-center justify-between border-t px-2 pt-3">
					<p className="text-xs text-muted-foreground">
						{startItem}–{endItem} of {total}
					</p>
					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon-xs"
							disabled={page <= 1 || isLoading}
							onClick={() => fetchPage(page - 1)}
							aria-label="Previous page"
						>
							<ChevronLeft className="h-3.5 w-3.5" />
						</Button>
						<span className="px-2 text-xs text-muted-foreground">
							{page} / {pageCount}
						</span>
						<Button
							variant="outline"
							size="icon-xs"
							disabled={page >= pageCount || isLoading}
							onClick={() => fetchPage(page + 1)}
							aria-label="Next page"
						>
							<ChevronRight className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
