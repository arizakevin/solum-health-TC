"use client";

import {
	Check,
	FileText,
	FileUp,
	Loader2,
	Plus,
	RefreshCw,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uploadDocument } from "@/app/actions/cases";
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
	status: "uploading" | "done" | "error";
	error?: string;
}

interface SourceDocumentsPanelProps {
	caseId: string;
	documents: DocumentInfo[];
	/** Calibrated extraction quality (0–100); null if case predates logprobs storage. */
	extractionConfidencePercent: number | null;
	formFilledCount: number;
	formTotalCount: number;
	extractionDate: Date | null;
	onReExtract: () => void;
	onDeleteDocument: (documentId: string) => Promise<void>;
	onUploadComplete: () => void;
	isExtracting: boolean;
}

export function SourceDocumentsPanel({
	caseId,
	documents,
	extractionConfidencePercent,
	formFilledCount,
	formTotalCount,
	extractionDate,
	onReExtract,
	onDeleteDocument,
	onUploadComplete,
	isExtracting,
}: SourceDocumentsPanelProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmDoc, setConfirmDoc] = useState<DocumentInfo | null>(null);
	const [uploads, setUploads] = useState<UploadingFile[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const pendingUploads = useRef(0);

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
			} catch (err) {
				setUploads((prev) =>
					prev.map((u) =>
						u.id === id
							? {
									...u,
									status: "error" as const,
									error: err instanceof Error ? err.message : "Upload failed",
								}
							: u,
					),
				);
			} finally {
				pendingUploads.current -= 1;
				if (pendingUploads.current === 0) {
					onUploadComplete();
				}
			}
		},
		[caseId, onUploadComplete],
	);

	const addFiles = useCallback(
		(files: FileList | File[]) => {
			const accepted = Array.from(files).filter((f) =>
				ACCEPTED_TYPES.includes(f.type),
			);
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
				"flex h-full flex-col rounded-lg border transition-colors",
				isDragOver && "border-primary bg-primary/5",
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b px-3 py-2">
				<h2 className="text-sm font-semibold">Source Documents</h2>
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
								PDF, PNG, JPG, TIFF — or drag & drop
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>

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
						Drag & drop or click to browse — PDF, PNG, JPG, TIFF
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

			{/* Document list + uploading items */}
			{!isEmpty && (
				<div className="flex flex-1 flex-col divide-y overflow-y-auto">
					{/* Persisted documents */}
					{documents.map((doc) => (
						<div
							key={doc.id}
							className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
						>
							<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{doc.filename}</p>
								<p className="text-xs text-muted-foreground">
									{doc.contentType.split("/")[1]?.toUpperCase() ??
										doc.contentType}
									{doc.pageCount != null && ` · ${doc.pageCount} pg`}
								</p>
							</div>
							<button
								type="button"
								onClick={() => setConfirmDoc(doc)}
								disabled={deletingId === doc.id || isExtracting}
								className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
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

					{/* Uploading / just-uploaded items (at bottom) */}
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
								{u.status === "error" && (
									<p className="text-xs text-destructive">{u.error}</p>
								)}
							</div>
							{u.status === "uploading" && (
								<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
							)}
							{u.status === "done" && (
								<Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
							)}
							{u.status === "error" && (
								<button
									type="button"
									onClick={() =>
										setUploads((prev) => prev.filter((x) => x.id !== u.id))
									}
									className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
									aria-label="Dismiss"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							)}
						</div>
					))}
				</div>
			)}

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
						{extractionConfidencePercent == null && formTotalCount > 0 && (
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
									Confidence score not yet available. Re-extract this case to
									see how confident the AI is about the results.
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				</TooltipProvider>
				<Button
					variant="ghost"
					size="sm"
					onClick={onReExtract}
					disabled={isExtracting || documents.length === 0 || isUploading}
				>
					<RefreshCw
						className={`mr-1 h-3 w-3 ${isExtracting ? "animate-spin" : ""}`}
					/>
					{isExtracting ? "Extracting..." : "Re-extract"}
				</Button>
			</div>

			{hiddenInput}

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
