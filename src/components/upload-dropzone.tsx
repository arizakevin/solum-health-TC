"use client";

import { Check, FileUp, Loader2, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { uploadDocument } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/tiff",
];

interface QueuedFile {
	file: File;
	id: string;
	progress: number;
	status: "uploading" | "done" | "error";
	error?: string;
	selected: boolean;
}

interface UploadDropzoneProps {
	caseId: string;
	onAllUploaded: () => void;
}

export function UploadDropzone({ caseId, onAllUploaded }: UploadDropzoneProps) {
	const [queue, setQueue] = useState<QueuedFile[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const hasCalledDone = useRef(false);

	const doneCount = queue.filter((f) => f.status === "done").length;
	const allDone =
		queue.length > 0 && queue.every((f) => f.status !== "uploading");
	const hasUploaded = doneCount > 0;
	const isUploading = queue.some((f) => f.status === "uploading");

	const selectedIds = new Set(queue.filter((f) => f.selected).map((f) => f.id));
	const selectableFiles = queue.filter((f) => f.status !== "uploading");
	const allSelected =
		selectableFiles.length > 0 && selectableFiles.every((f) => f.selected);

	const uploadFile = useCallback(
		async (item: QueuedFile) => {
			setQueue((prev) =>
				prev.map((f) =>
					f.id === item.id ? { ...f, status: "uploading", progress: 30 } : f,
				),
			);
			try {
				const formData = new FormData();
				formData.set("file", item.file);
				await uploadDocument(caseId, formData);
				setQueue((prev) =>
					prev.map((f) =>
						f.id === item.id ? { ...f, status: "done", progress: 100 } : f,
					),
				);
			} catch (err) {
				setQueue((prev) =>
					prev.map((f) =>
						f.id === item.id
							? {
									...f,
									status: "error",
									error: err instanceof Error ? err.message : "Upload failed",
								}
							: f,
					),
				);
			}
		},
		[caseId],
	);

	const addFiles = useCallback(
		(files: FileList | File[]) => {
			const accepted = Array.from(files).filter((f) =>
				ACCEPTED_TYPES.includes(f.type),
			);
			if (accepted.length === 0) return;

			const newItems: QueuedFile[] = accepted.map((file) => ({
				file,
				id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
				progress: 0,
				status: "uploading" as const,
				selected: false,
			}));

			setQueue((prev) => [...prev, ...newItems]);
			hasCalledDone.current = false;

			for (const item of newItems) {
				uploadFile(item);
			}
		},
		[uploadFile],
	);

	const removeFiles = useCallback((ids: Set<string>) => {
		setQueue((prev) => prev.filter((f) => !ids.has(f.id)));
	}, []);

	const toggleSelect = (id: string) => {
		setQueue((prev) =>
			prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)),
		);
	};

	const toggleSelectAll = () => {
		const next = !allSelected;
		setQueue((prev) =>
			prev.map((f) =>
				f.status === "uploading" ? f : { ...f, selected: next },
			),
		);
	};

	useEffect(() => {
		if (allDone && hasUploaded && !hasCalledDone.current) {
			hasCalledDone.current = true;
		}
	}, [allDone, hasUploaded]);

	return (
		<div className="space-y-4">
			<div
				role="button"
				tabIndex={0}
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragOver(true);
				}}
				onDragLeave={() => setIsDragOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setIsDragOver(false);
					addFiles(e.dataTransfer.files);
				}}
				className={cn(
					"flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors",
					isDragOver
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25",
				)}
			>
				<Upload className="h-10 w-10 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">
					Drag and drop files here, or
				</p>
				<Button
					variant="outline"
					size="sm"
					onClick={() => inputRef.current?.click()}
				>
					<FileUp className="mr-2 h-4 w-4" />
					Browse Files
				</Button>
				<p className="text-xs text-muted-foreground">
					PDF, PNG, JPG, TIFF accepted
				</p>
				<input
					ref={inputRef}
					type="file"
					multiple
					accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
					className="hidden"
					onChange={(e) => {
						if (e.target.files) addFiles(e.target.files);
						e.target.value = "";
					}}
				/>
			</div>

			{queue.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={allSelected}
								onChange={toggleSelectAll}
								className="h-3.5 w-3.5 accent-primary"
								aria-label="Select all files"
							/>
							<h3 className="text-sm font-medium">
								{queue.length} file{queue.length !== 1 ? "s" : ""}
								{isUploading && (
									<span className="ml-1.5 text-muted-foreground font-normal">
										· uploading...
									</span>
								)}
							</h3>
						</div>
						{selectedIds.size > 0 && (
							<Button
								variant="ghost"
								size="xs"
								className="text-destructive hover:text-destructive"
								onClick={() => removeFiles(selectedIds)}
							>
								<Trash2 className="mr-1.5 h-3 w-3" />
								Delete{" "}
								{selectedIds.size === queue.length ? "all" : selectedIds.size}
							</Button>
						)}
					</div>

					{queue.map((item) => (
						<div
							key={item.id}
							className="flex items-center gap-3 rounded-md border px-3 py-2"
						>
							<input
								type="checkbox"
								checked={item.selected}
								disabled={item.status === "uploading"}
								onChange={() => toggleSelect(item.id)}
								className="h-3.5 w-3.5 shrink-0 accent-primary"
								aria-label={`Select ${item.file.name}`}
							/>
							<FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm">{item.file.name}</p>
								<p className="text-xs text-muted-foreground">
									{(item.file.size / 1024).toFixed(0)} KB
								</p>
								{item.status === "uploading" && (
									<Progress value={item.progress} className="mt-1 h-1" />
								)}
								{item.status === "error" && (
									<p className="text-xs text-destructive">{item.error}</p>
								)}
							</div>
							<span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
								{item.status === "done" && (
									<>
										<Check className="h-3.5 w-3.5 text-green-500" />
										Done
									</>
								)}
								{item.status === "uploading" && (
									<>
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
										Uploading
									</>
								)}
								{item.status === "error" && "Failed"}
							</span>
							{item.status !== "uploading" && (
								<button
									type="button"
									onClick={() => removeFiles(new Set([item.id]))}
									className="shrink-0 text-muted-foreground hover:text-foreground"
									aria-label={`Remove ${item.file.name}`}
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{hasUploaded && allDone && (
				<div className="flex justify-end">
					<Button onClick={onAllUploaded}>Continue to extraction &rarr;</Button>
				</div>
			)}
		</div>
	);
}
