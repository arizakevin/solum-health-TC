"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteDocument } from "@/app/actions/cases";
import {
	approveAndGeneratePdf,
	saveFormDraft,
	triggerExtraction,
} from "@/app/actions/extraction";
import { DeleteCaseButton } from "@/components/delete-case-button";
import {
	ExtractionSettings,
	type ExtractionSettingsValues,
} from "@/components/extraction-settings";
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
	/** Logprobs-based 0–100; null until a post-change re-extraction stores it. */
	extractionConfidencePercent: number | null;
	formFilledCount: number;
	formTotalCount: number;
	extractionDate: Date | null;
	ocrAvailable: boolean;
}

export function CaseReviewClient({
	caseId,
	caseStatus,
	documents,
	extraction,
	extractionConfidencePercent,
	formFilledCount,
	formTotalCount,
	extractionDate,
	ocrAvailable,
}: CaseReviewClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isExtracting, setIsExtracting] = useState(false);
	const autoExtractFired = useRef(false);
	const [ocrSettings, setOcrSettings] = useState<ExtractionSettingsValues>({
		enhancedOcr: true,
		forceOcr: false,
	});

	useEffect(() => {
		if (
			searchParams.get("extract") === "1" &&
			!autoExtractFired.current &&
			!extraction &&
			documents.length > 0
		) {
			autoExtractFired.current = true;
			window.history.replaceState(null, "", `/case/${caseId}`);
			handleReExtract();
		}
	});

	async function handleReExtract() {
		setIsExtracting(true);
		try {
			await triggerExtraction(caseId, {
				enhancedOcr: ocrSettings.enhancedOcr,
				forceOcr: ocrSettings.forceOcr,
			});
			router.refresh();
		} catch (err) {
			console.error("Re-extraction failed:", err);
		} finally {
			setIsExtracting(false);
		}
	}

	async function handleDeleteDocument(documentId: string) {
		await deleteDocument(documentId);
		router.refresh();
	}

	function handleUploadComplete() {
		router.refresh();
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
			<div className="mb-4 flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 flex-wrap items-center gap-3">
					<div>
						<p className="text-xs text-muted-foreground">Case Review</p>
						<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
							#{caseId.slice(0, 8)}
						</h1>
					</div>
					<Badge variant="secondary">{caseStatus}</Badge>
				</div>
				<DeleteCaseButton
					caseId={caseId}
					caseDisplayId={`#${caseId.slice(0, 8)}`}
					variant="button"
					redirectHome
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-stretch">
				<div className="flex min-h-[300px] flex-col gap-3 sm:min-h-[500px] lg:h-full">
					<div className="flex min-h-0 flex-1 flex-col">
						<SourceDocumentsPanel
							caseId={caseId}
							documents={documents}
							extractionConfidencePercent={extractionConfidencePercent}
							formFilledCount={formFilledCount}
							formTotalCount={formTotalCount}
							extractionDate={extractionDate}
							onReExtract={handleReExtract}
							onDeleteDocument={handleDeleteDocument}
							onUploadComplete={handleUploadComplete}
							isExtracting={isExtracting}
						/>
					</div>
					<ExtractionSettings
						value={ocrSettings}
						onChange={setOcrSettings}
						ocrAvailable={ocrAvailable}
					/>
				</div>

				<div className="flex min-h-[300px] flex-col sm:min-h-[500px] lg:h-full">
					<div className="flex min-h-0 flex-1 flex-col">
						{hasExtraction ? (
							<ServiceRequestForm
								extraction={extraction as unknown as ServiceRequestExtraction}
								onSave={handleSave}
								onApprove={handleApprove}
							/>
						) : (
							<div className="flex min-h-0 flex-1 flex-col">
								<div className="flex flex-1 items-center justify-center rounded-lg border px-4 text-center text-muted-foreground">
									{caseStatus === "Extracting" ? (
										<div className="text-center">
											<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
											<p>Extracting data from documents...</p>
										</div>
									) : (
										<p>
											No extraction data yet. Upload documents and run
											extraction.
										</p>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
