"use client";

import { Plus, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { createCase, deleteDocument } from "@/app/actions/cases";
import {
	approveAndGeneratePdf,
	finalizeExtractionConfidence,
	saveFormDraft,
	triggerExtraction,
} from "@/app/actions/extraction";
import { DeleteCaseButton } from "@/components/delete-case-button";
import {
	DocumentPreviewFrame,
	type PreviewDocument,
} from "@/components/document-preview-frame";
import {
	ExtractionSettingsPopover,
	type ExtractionSettingsValues,
} from "@/components/extraction-settings";
import {
	ALL_FORM_SECTION_IDS,
	DEFAULT_FORM_OPEN_SECTION_IDS,
	ServiceRequestForm,
} from "@/components/service-request-form";
import { ServiceRequestFormTutorialPreview } from "@/components/service-request-form-tutorial-preview";
import { SourceDocumentsPanel } from "@/components/source-documents-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createEmptyServiceRequestExtraction } from "@/lib/service-request-empty";
import { serviceRequestFormHasAnyFilledValue } from "@/lib/service-request-form-filled";
import {
	STEP_EXTRACTION_SETTINGS,
	STEP_RUN_EXTRACT,
	STEP_TRY_UPLOAD,
} from "@/lib/tutorial-steps";
import type { ServiceRequestExtraction } from "@/lib/types/service-request";
import { cn } from "@/lib/utils";
import { useExtractionPreferencesStore } from "@/stores/extraction-preferences-store";
import { useTutorialStore } from "@/stores/tutorial-store";
import { useTutorialTourSignalsStore } from "@/stores/tutorial-tour-signals-store";

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
	const autoExtractOnUpload = useExtractionPreferencesStore(
		(s) => s.autoExtractOnUpload,
	);
	const accordionExclusiveMode = useExtractionPreferencesStore(
		(s) => s.accordionExclusiveMode,
	);
	const setAccordionExclusiveMode = useExtractionPreferencesStore(
		(s) => s.setAccordionExclusiveMode,
	);
	const isTutorialActive = useTutorialStore((s) => s.isTutorialActive);
	const tutorialCurrentStep = useTutorialStore((s) => s.currentStep);
	const [tutorialDocFloor, setTutorialDocFloor] = useState(0);
	const [formOpenSections, setFormOpenSections] = useState<string[]>(() => [
		...DEFAULT_FORM_OPEN_SECTION_IDS,
	]);
	const [selectedPreviewDoc, setSelectedPreviewDoc] =
		useState<PreviewDocument | null>(null);
	const [formHasFilledValues, setFormHasFilledValues] = useState(() =>
		extraction
			? serviceRequestFormHasAnyFilledValue(
					extraction as unknown as ServiceRequestExtraction,
				)
			: false,
	);
	const [extractionSettingsTourOpen, setExtractionSettingsTourOpen] =
		useState(false);

	const prevCaseIdRef = useRef(caseId);
	const autoExtractFired = useRef(false);

	// Reset on case switch
	if (prevCaseIdRef.current !== caseId) {
		prevCaseIdRef.current = caseId;
		setTutorialDocFloor(0);
		setFormOpenSections([...DEFAULT_FORM_OPEN_SECTION_IDS]);
		setSelectedPreviewDoc(null);
		setExtractionSettingsTourOpen(false);
		setFormHasFilledValues(
			extraction
				? serviceRequestFormHasAnyFilledValue(
						extraction as unknown as ServiceRequestExtraction,
					)
				: false,
		);
		autoExtractFired.current = false;
	}

	const handleAccordionExclusiveChange = useCallback(
		(checked: boolean) => {
			setAccordionExclusiveMode(checked);
			if (checked) {
				setFormOpenSections((prev) => prev.slice(0, 1));
			}
		},
		[setAccordionExclusiveMode],
	);

	/* ── Extraction / upload handlers ── */
	const [isCreatingCase, setIsCreatingCase] = useState(false);
	const [isExtracting, setIsExtracting] = useState(false);
	const [isConfidenceScoring, setIsConfidenceScoring] = useState(false);
	const [ocrSettings, setOcrSettings] = useState<ExtractionSettingsValues>({
		enhancedOcr: true,
	});

	const handleNewCase = useCallback(async () => {
		setIsCreatingCase(true);
		try {
			const id = await createCase();
			router.push(`/case/${id}`);
		} catch (err) {
			console.error("Create case failed:", err);
		} finally {
			setIsCreatingCase(false);
		}
	}, [router]);

	const handleFormFilledStateChange = useCallback((hasFilled: boolean) => {
		setFormHasFilledValues(hasFilled);
	}, []);

	const isCaseViewEmpty = documents.length === 0 && !formHasFilledValues;

	const handleReExtract = useCallback(async () => {
		setIsExtracting(true);
		try {
			const result = await triggerExtraction(caseId, {
				enhancedOcr: ocrSettings.enhancedOcr,
			});
			if (result.confidenceFollowUp === "openai") {
				setIsConfidenceScoring(true);
			}
			router.refresh();
			toast.success("Extraction complete", {
				description: "The request form has been updated from your documents.",
			});
			if (result.confidenceFollowUp === "openai") {
				try {
					const fin = await finalizeExtractionConfidence(caseId);
					if (!fin.ok) {
						toast.error("Confidence score unavailable", {
							description: fin.error,
						});
					}
				} finally {
					setIsConfidenceScoring(false);
					router.refresh();
				}
			}
		} catch (err) {
			console.error("Re-extraction failed:", err);
			const message =
				err instanceof Error
					? err.message
					: "Extraction could not be completed";
			toast.error("Extraction failed", { description: message });
		} finally {
			setIsExtracting(false);
		}
	}, [caseId, ocrSettings.enhancedOcr, router]);

	useEffect(() => {
		if (
			searchParams.get("extract") === "1" &&
			!autoExtractFired.current &&
			!extraction &&
			documents.length > 0
		) {
			autoExtractFired.current = true;
			window.history.replaceState(null, "", `/case/${caseId}`);
			void handleReExtract();
		}
	}, [caseId, documents.length, extraction, handleReExtract, searchParams]);

	async function handleDeleteDocument(documentId: string) {
		if (selectedPreviewDoc?.id === documentId) setSelectedPreviewDoc(null);
		await deleteDocument(documentId);
		router.refresh();
	}

	const handleUploadQueued = useCallback(() => {
		setTutorialDocFloor((f) => Math.max(f, documents.length + 1));
	}, [documents.length]);

	const handleUploadEachSuccess = useCallback(() => {
		setTutorialDocFloor((f) => Math.max(f, documents.length + 1));
		void router.refresh();
	}, [documents.length, router]);

	const handleUploadComplete = useCallback(async () => {
		void router.refresh();
		if (autoExtractOnUpload && caseStatus !== "Extracting" && !isExtracting) {
			await handleReExtract();
		}
	}, [autoExtractOnUpload, caseStatus, handleReExtract, isExtracting, router]);

	async function handleSave(data: ServiceRequestExtraction) {
		await saveFormDraft(caseId, data);
	}

	async function handleApprove(data: ServiceRequestExtraction) {
		await approveAndGeneratePdf(caseId, data);
		router.push(`/case/${caseId}/pdf`);
	}

	const handleDocumentSelect = useCallback(
		(doc: { id: string; filename: string; contentType: string }) => {
			setSelectedPreviewDoc((prev) => (prev?.id === doc.id ? null : doc));
		},
		[],
	);

	const hasExtraction = extraction !== null;
	const formExtraction = useMemo((): ServiceRequestExtraction => {
		if (extraction) {
			return extraction as unknown as ServiceRequestExtraction;
		}
		return createEmptyServiceRequestExtraction();
	}, [extraction]);

	const showTutorialFormPreview =
		isTutorialActive &&
		tutorialCurrentStep === STEP_TRY_UPLOAD &&
		!hasExtraction;

	const formAnySectionOpen = formOpenSections.length > 0;
	const formAllSectionsOpen =
		formOpenSections.length === ALL_FORM_SECTION_IDS.length;

	/* ── Tutorial ── */
	useEffect(() => {
		if (tutorialDocFloor > 0 && documents.length >= tutorialDocFloor) {
			setTutorialDocFloor(0);
		}
	}, [documents.length, tutorialDocFloor]);

	useEffect(() => {
		if (!isTutorialActive) {
			setTutorialDocFloor(0);
			setExtractionSettingsTourOpen(false);
			useTutorialTourSignalsStore.getState().setTourCaseSignals(null);
			return;
		}
		const documentCount = Math.max(documents.length, tutorialDocFloor);
		useTutorialTourSignalsStore.getState().setTourCaseSignals({
			caseId,
			documentCount,
			hasExtraction,
			caseStatus,
			isExtracting: isExtracting || caseStatus === "Extracting",
			extractionSettingsOpen: extractionSettingsTourOpen,
			sideBySidePreviewOpen: selectedPreviewDoc !== null,
		});
		return () => {
			useTutorialTourSignalsStore.getState().setTourCaseSignals(null);
		};
	}, [
		isTutorialActive,
		caseId,
		documents.length,
		hasExtraction,
		caseStatus,
		isExtracting,
		tutorialDocFloor,
		extractionSettingsTourOpen,
		selectedPreviewDoc,
	]);

	useLayoutEffect(() => {
		if (!isTutorialActive || tutorialCurrentStep !== STEP_EXTRACTION_SETTINGS)
			return;
		document
			.getElementById("tour-tutorial-extraction-settings")
			?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
	}, [isTutorialActive, tutorialCurrentStep]);

	useLayoutEffect(() => {
		if (!isTutorialActive || tutorialCurrentStep !== STEP_TRY_UPLOAD) return;
		(
			document.getElementById("tour-source-documents-body") ??
			document.getElementById("case-source-documents")
		)?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	}, [isTutorialActive, tutorialCurrentStep]);

	const handleExtractionSettingsPopoverDone = useCallback(() => {
		if (isTutorialActive && tutorialCurrentStep === STEP_EXTRACTION_SETTINGS) {
			useTutorialStore.getState().setTutorialStep(STEP_RUN_EXTRACT);
		}
	}, [isTutorialActive, tutorialCurrentStep]);

	/** After opening the PDF preview, scroll so form actions stay reachable if they fell below the fold. */
	useLayoutEffect(() => {
		if (!selectedPreviewDoc) return;

		let cancelled = false;
		const scrollIfNeeded = () => {
			if (cancelled) return;
			const el = document.getElementById("tour-tutorial-approve-action");
			if (!el) return;
			const margin = 24;
			const rect = el.getBoundingClientRect();
			if (rect.bottom > window.innerHeight - margin) {
				el.scrollIntoView({
					behavior: "smooth",
					block: "end",
					inline: "nearest",
				});
			}
		};

		requestAnimationFrame(() => {
			if (cancelled) return;
			requestAnimationFrame(scrollIfNeeded);
		});
		const t = window.setTimeout(scrollIfNeeded, 450);

		return () => {
			cancelled = true;
			window.clearTimeout(t);
		};
	}, [selectedPreviewDoc]);

	return (
		<div>
			{/* Header */}
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
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={isCreatingCase || isCaseViewEmpty}
						title={
							isCaseViewEmpty
								? "Upload a document or add form data before starting another case"
								: undefined
						}
						onClick={() => void handleNewCase()}
					>
						<Plus className="mr-1.5 h-4 w-4" />
						{isCreatingCase ? "Creating…" : "New case"}
					</Button>
					<DeleteCaseButton
						caseId={caseId}
						caseDisplayId={`#${caseId.slice(0, 8)}`}
						variant="button"
						redirectHome
					/>
				</div>
			</div>

			{/* Source documents + review grid — tour step 7 highlights this whole workspace */}
			<div
				id="tour-tutorial-case-review-workspace"
				className="flex flex-col gap-3"
			>
				<div id="case-source-documents">
					<SourceDocumentsPanel
						caseId={caseId}
						documents={documents}
						hasExtraction={hasExtraction}
						extractionConfidencePercent={extractionConfidencePercent}
						extractionConfidenceLoading={isConfidenceScoring}
						formFilledCount={formFilledCount}
						formTotalCount={formTotalCount}
						extractionDate={extractionDate}
						onReExtract={handleReExtract}
						onDeleteDocument={handleDeleteDocument}
						onUploadComplete={handleUploadComplete}
						onEachUploadSuccess={handleUploadEachSuccess}
						onUploadQueued={handleUploadQueued}
						coalesceUploadBatchComplete={autoExtractOnUpload}
						isExtracting={isExtracting}
						collapsibleList
						onDocumentSelect={handleDocumentSelect}
						selectedDocumentId={selectedPreviewDoc?.id}
						extractionSettingsBeforeExtract={
							<ExtractionSettingsPopover
								id="tour-tutorial-extraction-settings"
								closeWhenTourPastSettings={
									isTutorialActive && tutorialCurrentStep >= STEP_RUN_EXTRACT
								}
								onDoneClick={handleExtractionSettingsPopoverDone}
								onOpenChange={setExtractionSettingsTourOpen}
								value={ocrSettings}
								onChange={setOcrSettings}
								ocrAvailable={ocrAvailable}
							/>
						}
					/>
				</div>

				{/* Form area: preview + bordered request-form panel */}
				<div
					id="case-review-grid"
					className={cn(
						"grid gap-4",
						selectedPreviewDoc ? "lg:grid-cols-2" : "grid-cols-1",
					)}
				>
					{/* Document preview — left column when a doc is selected */}
					{selectedPreviewDoc && (
						<div className="flex min-w-0 flex-col rounded-lg border bg-card">
							<div className="flex items-center justify-between border-b px-3 py-2">
								<p className="truncate text-sm font-medium">
									{selectedPreviewDoc.filename}
								</p>
								<button
									type="button"
									onClick={() => setSelectedPreviewDoc(null)}
									className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
									aria-label="Close preview"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
							<div className="min-h-0 flex-1 overflow-hidden p-3">
								<DocumentPreviewFrame
									document={selectedPreviewDoc}
									heightClass="h-[min(80vh,900px)]"
								/>
							</div>
						</div>
					)}

					{/* Request form — panel aligned with Source Documents (tour step 7 highlights whole card) */}
					<div
						id="tour-tutorial-form-sections"
						className="flex min-h-0 min-w-0 flex-col rounded-lg border bg-card text-card-foreground"
					>
						{!showTutorialFormPreview && (
							<div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
								<h2 className="text-sm font-semibold">Request form</h2>
								<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
									{!formAllSectionsOpen && !accordionExclusiveMode && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												setFormOpenSections([...ALL_FORM_SECTION_IDS])
											}
										>
											Open all
										</Button>
									)}
									{formAnySectionOpen && !accordionExclusiveMode && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => setFormOpenSections([])}
										>
											Collapse all
										</Button>
									)}
									<Label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground">
										<Switch
											size="sm"
											checked={accordionExclusiveMode}
											onCheckedChange={handleAccordionExclusiveChange}
										/>
										<span>One section at a time</span>
									</Label>
								</div>
							</div>
						)}
						<div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-3">
							{showTutorialFormPreview ? (
								<ServiceRequestFormTutorialPreview active={false} />
							) : (
								<ServiceRequestForm
									key={hasExtraction ? "extracted" : "manual"}
									extraction={formExtraction}
									onSave={handleSave}
									onApprove={handleApprove}
									openSections={formOpenSections}
									onOpenSectionsChange={setFormOpenSections}
									accordionMultiple={!accordionExclusiveMode}
									onFilledStateChange={handleFormFilledStateChange}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
