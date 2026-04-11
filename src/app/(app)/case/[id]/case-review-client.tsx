"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	approveAndGeneratePdf,
	saveFormDraft,
	triggerExtraction,
} from "@/app/actions/extraction";
import { ServiceRequestForm } from "@/components/service-request-form";
import { SourceDocumentsPanel } from "@/components/source-documents-panel";
import { Badge } from "@/components/ui/badge";
import type { ServiceRequestExtraction } from "@/lib/types/service-request";

interface CaseReviewClientProps {
	caseId: string;
	caseStatus: string;
	documents: {
		id: string;
		filename: string;
		contentType: string;
		pageCount: number | null;
		uploadedAt: Date;
	}[];
	extraction: Record<string, unknown> | null;
	aggregateConfidence: number;
	extractionDate: Date | null;
}

export function CaseReviewClient({
	caseId,
	caseStatus,
	documents,
	extraction,
	aggregateConfidence,
	extractionDate,
}: CaseReviewClientProps) {
	const router = useRouter();
	const [isExtracting, setIsExtracting] = useState(false);

	async function handleReExtract() {
		setIsExtracting(true);
		try {
			await triggerExtraction(caseId);
			router.refresh();
		} catch (err) {
			console.error("Re-extraction failed:", err);
		} finally {
			setIsExtracting(false);
		}
	}

	async function handleSave(data: ServiceRequestExtraction) {
		await saveFormDraft(caseId, data);
	}

	async function handleApprove(data: ServiceRequestExtraction) {
		await approveAndGeneratePdf(caseId, data);
		router.push(`/case/${caseId}/pdf`);
	}

	const hasExtraction = extraction !== null;

	return (
		<div>
			<div className="mb-4 flex items-center gap-3">
				<div>
					<p className="text-sm text-muted-foreground">
						Case Review /{" "}
						<span className="font-medium">#{caseId.slice(0, 8)}</span>
					</p>
					<h1 className="text-3xl font-bold tracking-tight">Case Review</h1>
				</div>
				<Badge variant="secondary">{caseStatus}</Badge>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
				<div className="min-h-[500px]">
					<SourceDocumentsPanel
						documents={documents}
						aggregateConfidence={aggregateConfidence}
						extractionDate={extractionDate}
						onReExtract={handleReExtract}
						isExtracting={isExtracting}
					/>
				</div>

				<div>
					{hasExtraction ? (
						<ServiceRequestForm
							extraction={extraction as unknown as ServiceRequestExtraction}
							onSave={handleSave}
							onApprove={handleApprove}
						/>
					) : (
						<div className="flex h-full min-h-[500px] items-center justify-center rounded-lg border text-muted-foreground">
							{caseStatus === "Extracting" ? (
								<div className="text-center">
									<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
									<p>Extracting data from documents...</p>
								</div>
							) : (
								<p>
									No extraction data yet. Upload documents and run extraction.
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
