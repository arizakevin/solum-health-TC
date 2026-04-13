"use client";

import { Download, FileWarning } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PreviewDocument {
	id: string;
	filename: string;
	contentType: string;
}

function isPdf(contentType: string): boolean {
	return contentType.toLowerCase().includes("pdf");
}

function isRasterImage(contentType: string): boolean {
	const t = contentType.toLowerCase();
	return t.includes("png") || t.includes("jpeg") || t.includes("jpg");
}

function isTiff(contentType: string): boolean {
	const t = contentType.toLowerCase();
	return t.includes("tiff") || t.includes("tif");
}

interface DocumentPreviewFrameProps {
	document: PreviewDocument;
	/** Override height class for the iframe / image container. @default "h-[min(75vh,760px)]" */
	heightClass?: string;
}

export function DocumentPreviewFrame({
	document,
	heightClass = "h-[min(75vh,760px)]",
}: DocumentPreviewFrameProps) {
	const src = useMemo(
		() => `/api/case-documents/${document.id}`,
		[document.id],
	);

	/**
	 * PDF fragment hints for the browser’s built-in viewer (Chromium / most WebKit).
	 * Not all engines honor every flag; unsupported fragments are ignored safely.
	 * - navpanes=0: hide thumbnail / outline sidebar so the page uses full width
	 * - view=FitH: fit page to viewer width (larger readable text)
	 */
	const pdfSrc = useMemo(() => `${src}#navpanes=0&view=FitH`, [src]);

	if (isPdf(document.contentType)) {
		return (
			<iframe
				key={document.id}
				title={document.filename}
				src={pdfSrc}
				className={cn("w-full rounded-md border bg-muted/30", heightClass)}
			/>
		);
	}

	if (isRasterImage(document.contentType)) {
		return (
			<div className={cn("relative mx-auto w-full max-w-full", heightClass)}>
				<Image
					key={document.id}
					unoptimized
					src={src}
					alt=""
					fill
					className="object-contain"
					sizes="(max-width: 768px) 100vw, 896px"
				/>
			</div>
		);
	}

	if (isTiff(document.contentType)) {
		return (
			<div className="flex flex-col items-center justify-center gap-4 rounded-md border bg-muted/20 px-4 py-12 text-center">
				<FileWarning className="h-10 w-10 text-muted-foreground" />
				<div className="space-y-1">
					<p className="text-sm font-medium">
						TIFF preview is not available in the browser
					</p>
					<p className="text-xs text-muted-foreground">
						Download the file to open it in an image viewer, or convert to PDF
						for inline preview.
					</p>
				</div>
				<a
					href={src}
					download={document.filename}
					className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
				>
					<Download className="mr-2 h-4 w-4" />
					Download
				</a>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-md border bg-muted/20 px-4 py-12 text-center">
			<p className="text-sm text-muted-foreground">
				Inline preview is not available for this file type.
			</p>
			<a
				href={src}
				download={document.filename}
				className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
			>
				<Download className="mr-2 h-4 w-4" />
				Download
			</a>
		</div>
	);
}
