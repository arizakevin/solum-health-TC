"use client";

import {
	Check,
	ChevronDown,
	FileText,
	FileUp,
	Loader2,
	Plus,
	RefreshCw,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadDocument } from "@/app/actions/cases";
import { DocumentPreviewDialog } from "@/components/document-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/tiff",
];
const ACCEPT_STRING = ".pdf,.png,.jpg,.jpeg,.tiff,.tif";
const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB

/** After the last in-flight upload ends, wait this long so multi-file drops (and quick follow-up picks) fire one completion callback. */
const UPLOAD_COMPLETE_SETTLE_MS = 280;

interface DocumentInfo {
	id: string;
	filename: string;
	contentType: string;
	pageCount: number | null;
	uploadedAt: Date;
}

interface UploadingFile {
	id: string;
	name: string;
	progress: number;
	status: "uploading" | "done";
}

interface SourceDocumentsPanelProps {
	caseId: string;
	documents: DocumentInfo[];
	/** True once the case has stored extraction output (first run or later). */
	hasExtraction: boolean;
	/** Calibrated extraction quality (0–100); null if case predates logprobs storage. */
	extractionConfidencePercent: number | null;
	/** When true with a null percent, show a scoring state (deferred OpenAI confidence). */
	extractionConfidenceLoading?: boolean;
	formFilledCount: number;
	formTotalCount: number;
	extractionDate: Date | null;
	onReExtract: () => void;
	onDeleteDocument: (documentId: string) => Promise<void>;
	onUploadComplete: () => void | Promise<void>;
	/** Called after each file is persisted (before batch `onUploadComplete`). Use to refresh server-backed lists. */
	onEachUploadSuccess?: () => void;
	/** Called as soon as a file is queued for upload (before the network request starts). */
	onUploadQueued?: () => void;
	/** When true, wait until uploads have been idle briefly so multi-file drops invoke `onUploadComplete` once. */
	coalesceUploadBatchComplete?: boolean;
	isExtracting: boolean;
	/** When true, the document list can be collapsed via a header toggle. */
	collapsibleList?: boolean;
	/** Called when a document is clicked for preview; if omitted, the internal dialog is used. */
	onDocumentSelect?: (doc: DocumentInfo) => void;
	/** Id of the currently selected document for visual highlight. */
	selectedDocumentId?: string;
	/** Rendered to the left of Run extraction / Re-extract (e.g. extraction settings popover). */
	extractionSettingsBeforeExtract?: ReactNode;
}

interface SourceDocumentsListRowsProps {
	documents: DocumentInfo[];
	uploads: UploadingFile[];
	selectedDocumentId?: string;
	isExtracting: boolean;
	onDocumentSelect?: (doc: DocumentInfo) => void;
	setPreviewDoc: (doc: DocumentInfo | null) => void;
	setConfirmDoc: (doc: DocumentInfo | null) => void;
	deletingId: string | null;
	setUploads: Dispatch<SetStateAction<UploadingFile[]>>;
}

function SourceDocumentsListRows({
	documents,
	uploads,
	selectedDocumentId,
	isExtracting,
	onDocumentSelect,
	setPreviewDoc,
	setConfirmDoc,
	deletingId,
	setUploads,
}: SourceDocumentsListRowsProps) {
	return (
		<>
			{documents.map((doc, index) => (
				<div
					key={doc.id}
					className="group flex w-full min-w-0 items-center gap-1 sm:gap-2"
				>
					<Tooltip>
						<TooltipTrigger
							delay={200}
							render={
								<button
									type="button"
									id={
										index === 0
											? "tour-case-review-first-source-doc"
											: undefined
									}
									onClick={() =>
										onDocumentSelect
											? onDocumentSelect(doc)
											: setPreviewDoc(doc)
									}
									disabled={isExtracting}
									className={cn(
										"flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-left outline-none ring-offset-background transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
										selectedDocumentId === doc.id && "bg-primary/5",
									)}
								/>
							}
						>
							<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
							<span className="min-w-0 flex-1">
								<span className="flex min-w-0 items-center gap-x-2 text-sm">
									<span className="min-w-0 truncate font-medium">
										{doc.filename}
									</span>
									<span className="shrink-0 text-xs font-normal text-muted-foreground">
										{doc.contentType.split("/")[1]?.toUpperCase() ??
											doc.contentType}
										{doc.pageCount != null && ` · ${doc.pageCount} pg`}
									</span>
								</span>
							</span>
						</TooltipTrigger>
						<TooltipContent
							side="left"
							align="center"
							sideOffset={8}
							className="max-w-56 px-2 py-1.5 text-[11px] leading-snug"
						>
							{onDocumentSelect
								? "Click to preview this document beside the form."
								: "Click to open preview."}
						</TooltipContent>
					</Tooltip>
					<button
						type="button"
						onClick={() => setConfirmDoc(doc)}
						disabled={deletingId === doc.id || isExtracting}
						className="shrink-0 rounded-md px-2 py-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
						aria-label={`Remove ${doc.filename}`}
					>
						{deletingId === doc.id ? (
							<RefreshCw className="h-3.5 w-3.5 animate-spin" />
						) : (
							<X className="h-3.5 w-3.5" />
						)}
					</button>
				</div>
			))}
			{uploads.map((u) => (
				<div key={u.id} className="flex items-center gap-3 px-3 py-2.5">
					{u.status === "done" ? (
						<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
					) : (
						<FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
					)}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium">{u.name}</p>
						{u.status === "uploading" && (
							<Progress value={u.progress} className="mt-1 h-1" />
						)}
					</div>
					{u.status === "uploading" && (
						<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
					)}
					{u.status === "done" && (
						<Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
					)}
				</div>
			))}
		</>
	);
}

export function SourceDocumentsPanel({
	caseId,
	documents,
	hasExtraction,
	extractionConfidencePercent,
	extractionConfidenceLoading = false,
	formFilledCount,
	formTotalCount,
	extractionDate,
	onReExtract,
	onDeleteDocument,
	onUploadComplete,
	onEachUploadSuccess,
	onUploadQueued,
	coalesceUploadBatchComplete = false,
	isExtracting,
	collapsibleList = false,
	onDocumentSelect,
	selectedDocumentId,
	extractionSettingsBeforeExtract,
}: SourceDocumentsPanelProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmDoc, setConfirmDoc] = useState<DocumentInfo | null>(null);
	const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null);
	const [uploads, setUploads] = useState<UploadingFile[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isListCollapsed, setIsListCollapsed] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const pendingUploads = useRef(0);
	const uploadCompleteFlushRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	useEffect(() => {
		return () => {
			if (uploadCompleteFlushRef.current != null) {
				clearTimeout(uploadCompleteFlushRef.current);
				uploadCompleteFlushRef.current = null;
			}
		};
	}, []);

	const isUploading = uploads.some((u) => u.status === "uploading");
	const hasDocuments = documents.length > 0;
	const isEmpty = !hasDocuments && uploads.length === 0;

	// Prune "done" upload entries once the server data arrives with the file
	const docFilenameKey = useMemo(
		() => documents.map((d) => d.filename).join("\n"),
		[documents],
	);
	useEffect(() => {
		const names = new Set(docFilenameKey.split("\n"));
		setUploads((prev) => {
			const next = prev.filter(
				(u) => u.status !== "done" || !names.has(u.name),
			);
			return next.length === prev.length ? prev : next;
		});
	}, [docFilenameKey]);

	const uploadFile = useCallback(
		async (file: File) => {
			const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
			setUploads((prev) => [
				...prev,
				{ id, name: file.name, progress: 30, status: "uploading" },
			]);
			onUploadQueued?.();
			if (uploadCompleteFlushRef.current != null) {
				clearTimeout(uploadCompleteFlushRef.current);
				uploadCompleteFlushRef.current = null;
			}
			pendingUploads.current += 1;

			try {
				const formData = new FormData();
				formData.set("file", file);
				await uploadDocument(caseId, formData);
				setUploads((prev) =>
					prev.map((u) =>
						u.id === id ? { ...u, status: "done" as const, progress: 100 } : u,
					),
				);
				onEachUploadSuccess?.();
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Upload failed";
				const displayMessage =
					errorMessage.includes("Unexpected token") &&
					errorMessage.includes("is not valid JSON")
						? "File exceeded the maximum allowed size (4.5MB) or the server returned a bad request."
						: errorMessage.includes("413") ||
								errorMessage.includes("Content Too Large")
							? "File is too large (Maximum 4.5MB)."
							: errorMessage;

				toast.error(`Failed to upload ${file.name}`, {
					description: displayMessage,
				});
				setUploads((prev) => prev.filter((u) => u.id !== id));
			} finally {
				pendingUploads.current -= 1;
				if (pendingUploads.current === 0) {
					if (coalesceUploadBatchComplete) {
						if (uploadCompleteFlushRef.current != null) {
							clearTimeout(uploadCompleteFlushRef.current);
						}
						uploadCompleteFlushRef.current = setTimeout(() => {
							uploadCompleteFlushRef.current = null;
							if (pendingUploads.current === 0) {
								void Promise.resolve(onUploadComplete());
							}
						}, UPLOAD_COMPLETE_SETTLE_MS);
					} else {
						void Promise.resolve(onUploadComplete());
					}
				}
			}
		},
		[
			caseId,
			coalesceUploadBatchComplete,
			onEachUploadSuccess,
			onUploadComplete,
			onUploadQueued,
		],
	);

	const addFiles = useCallback(
		(files: FileList | File[]) => {
			const accepted = Array.from(files).filter((f) => {
				if (!ACCEPTED_TYPES.includes(f.type)) {
					toast.error(`Unsupported file type: ${f.name}`, {
						description: "Please upload PDF, PNG, JPG, or TIFF files.",
					});
					return false;
				}
				if (f.size > MAX_FILE_SIZE_BYTES) {
					toast.error(`File too large: ${f.name}`, {
						description: "Maximum allowed file size is 4.5MB.",
					});
					return false;
				}
				return true;
			});
			for (const file of accepted) {
				uploadFile(file);
			}
		},
		[uploadFile],
	);

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
		setIsDragOver(true);
	}
	function handleDragLeave() {
		setIsDragOver(false);
	}
	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragOver(false);
		addFiles(e.dataTransfer.files);
	}

	async function handleConfirmDelete() {
		if (!confirmDoc) return;
		setDeletingId(confirmDoc.id);
		try {
			await onDeleteDocument(confirmDoc.id);
		} finally {
			setDeletingId(null);
			setConfirmDoc(null);
		}
	}

	const hiddenInput = (
		<input
			ref={inputRef}
			type="file"
			multiple
			accept={ACCEPT_STRING}
			className="hidden"
			onChange={(e) => {
				if (e.target.files) addFiles(e.target.files);
				e.target.value = "";
			}}
		/>
	);

	return (
		<div
			className={cn(
				"flex h-full min-h-0 w-full min-w-0 flex-1 flex-col rounded-lg border transition-colors",
				isDragOver && "border-primary bg-primary/5",
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b px-3 py-2">
				{collapsibleList && hasDocuments ? (
					<button
						type="button"
						aria-expanded={!isListCollapsed}
						onClick={() => setIsListCollapsed((o) => !o)}
						className="flex items-center gap-1.5 text-left transition-colors hover:text-foreground"
					>
						<h2 className="text-sm font-semibold">Source Documents</h2>
						<ChevronDown
							className={cn(
								"h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out motion-reduce:transition-none",
								isListCollapsed ? "-rotate-90" : "rotate-0",
							)}
						/>
					</button>
				) : (
					<h2 className="text-sm font-semibold">Source Documents</h2>
				)}
				{!isEmpty && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger
								render={
									<button
										type="button"
										onClick={() => inputRef.current?.click()}
										className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									/>
								}
							>
								<Plus className="h-3 w-3" />
								Add
							</TooltipTrigger>
							<TooltipContent side="bottom">
								PDF, PNG, JPG, TIFF (Max 4.5MB) — or drag & drop
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>

			<div
				id="tour-source-documents-body"
				className="flex min-h-0 flex-1 flex-col"
			>
				{/* Empty state — full dropzone */}
				{isEmpty && (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground transition-colors hover:bg-muted/50"
					>
						<div
							className={cn(
								"flex h-10 w-10 items-center justify-center rounded-full border border-dashed transition-colors",
								isDragOver
									? "border-primary text-primary"
									: "border-muted-foreground/40",
							)}
						>
							<Upload className="h-5 w-5" />
						</div>
						<p className="text-sm font-medium text-foreground">
							{isDragOver ? "Drop to upload" : "Upload documents"}
						</p>
						<p className="text-xs">
							Drag & drop or click to browse — PDF, PNG, JPG, TIFF (Max 4.5MB)
						</p>
					</button>
				)}

				{/* Drag-over overlay for populated state */}
				{!isEmpty && isDragOver && (
					<div className="flex items-center justify-center gap-2 border-b bg-primary/5 px-3 py-3 text-sm font-medium text-primary">
						<Upload className="h-4 w-4" />
						Drop files to upload
					</div>
				)}

				{/* Document list + uploading (smooth height when collapsible) */}
				{!isEmpty &&
					(collapsibleList ? (
						<div
							className={cn(
								"grid min-h-0 flex-1 transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none",
								isListCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
							)}
						>
							<div
								className={cn(
									"min-h-0 overflow-hidden",
									isListCollapsed && "pointer-events-none",
								)}
							>
								<div className="flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
									<SourceDocumentsListRows
										documents={documents}
										uploads={uploads}
										selectedDocumentId={selectedDocumentId}
										isExtracting={isExtracting}
										onDocumentSelect={onDocumentSelect}
										setPreviewDoc={setPreviewDoc}
										setConfirmDoc={setConfirmDoc}
										deletingId={deletingId}
										setUploads={setUploads}
									/>
								</div>
							</div>
						</div>
					) : (
						<div className="flex flex-1 flex-col divide-y overflow-y-auto">
							<SourceDocumentsListRows
								documents={documents}
								uploads={uploads}
								selectedDocumentId={selectedDocumentId}
								isExtracting={isExtracting}
								onDocumentSelect={onDocumentSelect}
								setPreviewDoc={setPreviewDoc}
								setConfirmDoc={setConfirmDoc}
								deletingId={deletingId}
								setUploads={setUploads}
							/>
						</div>
					))}
			</div>

			{/* Footer */}
			<div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
				<TooltipProvider delay={300}>
					<div className="flex flex-wrap items-center gap-2">
						{extractionDate && (
							<span>
								Extracted{" "}
								{extractionDate.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})}
							</span>
						)}
						<span>
							{documents.length} doc{documents.length !== 1 ? "s" : ""}
						</span>
						{formTotalCount > 0 && (
							<Tooltip>
								<TooltipTrigger>
									<span className="inline-flex">
										<Badge variant="secondary" className="text-xs">
											{formFilledCount}/{formTotalCount} fields
										</Badge>
									</span>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs">
									{formFilledCount} of {formTotalCount} form fields have been
									filled — either from the extracted documents or your manual
									edits.
								</TooltipContent>
							</Tooltip>
						)}
						{extractionConfidencePercent != null && (
							<Tooltip>
								<TooltipTrigger>
									<span className="inline-flex">
										<Badge
											variant="outline"
											className={cn(
												"text-xs font-medium",
												extractionConfidencePercent >= 80
													? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
													: extractionConfidencePercent >= 50
														? "border-amber-500/40 bg-amber-500/10 text-amber-400"
														: "border-red-500/40 bg-red-500/10 text-red-400",
											)}
										>
											{Math.round(extractionConfidencePercent)}% confidence
										</Badge>
									</span>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs">
									How confident the AI was about the extracted values. Higher
									scores mean more reliable results.
								</TooltipContent>
							</Tooltip>
						)}
						{extractionConfidencePercent == null &&
							formTotalCount > 0 &&
							extractionConfidenceLoading && (
								<Tooltip>
									<TooltipTrigger>
										<span className="inline-flex">
											<Badge
												variant="outline"
												className="text-xs text-muted-foreground"
											>
												<Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
												Scoring…
											</Badge>
										</span>
									</TooltipTrigger>
									<TooltipContent className="max-w-xs">
										Calculating case-level extraction confidence. This usually
										finishes within a few seconds after the form updates.
									</TooltipContent>
								</Tooltip>
							)}
						{extractionConfidencePercent == null &&
							formTotalCount > 0 &&
							!extractionConfidenceLoading && (
								<Tooltip>
									<TooltipTrigger>
										<span className="inline-flex">
											<Badge
												variant="outline"
												className="text-xs text-muted-foreground"
											>
												Confidence: pending
											</Badge>
										</span>
									</TooltipTrigger>
									<TooltipContent className="max-w-xs">
										Confidence score not yet available. It may appear
										automatically after extraction when a verifier is
										configured; otherwise re-extract to try again.
									</TooltipContent>
								</Tooltip>
							)}
					</div>
				</TooltipProvider>
				<div className="flex shrink-0 items-center gap-1.5">
					{extractionSettingsBeforeExtract}
					<Button
						id="btn-case-extract"
						variant="ghost"
						size="sm"
						onClick={onReExtract}
						disabled={isExtracting || documents.length === 0 || isUploading}
					>
						<RefreshCw
							className={`mr-1 h-3 w-3 ${isExtracting ? "animate-spin" : ""}`}
						/>
						{isExtracting
							? "Extracting..."
							: hasExtraction
								? "Re-extract"
								: "Run extraction"}
					</Button>
				</div>
			</div>

			{hiddenInput}

			<DocumentPreviewDialog
				document={previewDoc}
				open={previewDoc !== null}
				onOpenChange={(next) => {
					if (!next) setPreviewDoc(null);
				}}
			/>

			{/* Confirm delete dialog */}
			<Dialog
				open={!!confirmDoc}
				onOpenChange={(o) => !o && setConfirmDoc(null)}
			>
				<DialogContent className="sm:max-w-md" showCloseButton>
					<DialogHeader>
						<DialogTitle>Remove document?</DialogTitle>
						<DialogDescription>
							<span className="font-medium text-foreground">
								{confirmDoc?.filename}
							</span>{" "}
							will be permanently deleted from this case and from storage. You
							can re-extract afterwards to update the form.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<DialogClose render={<Button variant="outline" type="button" />}>
							Cancel
						</DialogClose>
						<Button
							type="button"
							variant="destructive"
							disabled={!!deletingId}
							onClick={handleConfirmDelete}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							{deletingId ? "Removing..." : "Remove document"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
