"use client";

import {
	DocumentPreviewFrame,
	type PreviewDocument,
} from "@/components/document-preview-frame";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export type { PreviewDocument };

interface DocumentPreviewDialogProps {
	document: PreviewDocument | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({
	document,
	open,
	onOpenChange,
}: DocumentPreviewDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="flex max-h-[min(92vh,900px)] w-[min(100vw-1.5rem,56rem)] max-w-none flex-col gap-0 p-0 sm:max-w-none"
				showCloseButton
			>
				{document ? (
					<>
						<DialogHeader className="shrink-0 border-b px-4 py-3 pr-12 text-left">
							<DialogTitle className="truncate pr-2 font-heading text-base">
								{document.filename}
							</DialogTitle>
							<DialogDescription className="sr-only">
								Document preview for side-by-side review with the form.
							</DialogDescription>
						</DialogHeader>
						<div className="min-h-0 flex-1 overflow-hidden p-3">
							<DocumentPreviewFrame document={document} />
						</div>
					</>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
