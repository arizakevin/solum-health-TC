"use client";

import { FileUp, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { uploadDocument } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
	status: "pending" | "uploading" | "done" | "error";
	error?: string;
}

interface UploadDropzoneProps {
	caseId: string;
	onAllUploaded: () => void;
}

export function UploadDropzone({ caseId, onAllUploaded }: UploadDropzoneProps) {
	const [queue, setQueue] = useState<QueuedFile[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const allDone = queue.length > 0 && queue.every((f) => f.status === "done");
	const isUploading = queue.some((f) => f.status === "uploading");

	const addFiles = useCallback((files: FileList | File[]) => {
		const newFiles: QueuedFile[] = Array.from(files)
			.filter((f) => ACCEPTED_TYPES.includes(f.type))
			.map((file) => ({
				file,
				id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
				progress: 0,
				status: "pending" as const,
			}));
		setQueue((prev) => [...prev, ...newFiles]);
	}, []);

	const removeFile = (id: string) => {
		setQueue((prev) => prev.filter((f) => f.id !== id));
	};

	const handleUploadAll = async () => {
		const pending = queue.filter((f) => f.status === "pending");
		for (const item of pending) {
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
		}
	};

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
				className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors ${
					isDragOver
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25"
				}`}
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
					<h3 className="text-sm font-medium">
						Upload Queue ({queue.length} file{queue.length !== 1 ? "s" : ""})
					</h3>
					{queue.map((item) => (
						<div
							key={item.id}
							className="flex items-center gap-3 rounded-md border px-3 py-2"
						>
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
									<p className="text-xs text-red-500">{item.error}</p>
								)}
							</div>
							<span className="shrink-0 text-xs text-muted-foreground">
								{item.status === "done" && "✓"}
								{item.status === "uploading" && "Uploading..."}
								{item.status === "error" && "Failed"}
							</span>
							{item.status === "pending" && (
								<button
									type="button"
									onClick={() => removeFile(item.id)}
									className="shrink-0 text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
					))}
				</div>
			)}

			<div className="flex gap-2">
				{!allDone && (
					<Button
						onClick={handleUploadAll}
						disabled={queue.length === 0 || isUploading}
					>
						{isUploading ? "Uploading..." : "Upload All"}
					</Button>
				)}
				{allDone && <Button onClick={onAllUploaded}>Extract All &rarr;</Button>}
			</div>
		</div>
	);
}
