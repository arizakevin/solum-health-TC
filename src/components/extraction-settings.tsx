"use client";

import { ChevronDown, ScanSearch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ExtractionSettingsValues {
	enhancedOcr: boolean;
	forceOcr: boolean;
}

interface ExtractionSettingsProps {
	value: ExtractionSettingsValues;
	onChange: (next: ExtractionSettingsValues) => void;
	ocrAvailable: boolean;
}

export function ExtractionSettings({
	value,
	onChange,
	ocrAvailable,
}: ExtractionSettingsProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onPointerDown(e: PointerEvent) {
			const el = rootRef.current;
			if (el && !el.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("pointerdown", onPointerDown, true);
		return () =>
			document.removeEventListener("pointerdown", onPointerDown, true);
	}, [open]);

	if (!ocrAvailable) return null;

	return (
		<div ref={rootRef} className="relative z-20 shrink-0">
			<div className="rounded-lg border bg-card text-card-foreground">
				<button
					type="button"
					onClick={() => setOpen((o) => !o)}
					aria-expanded={open}
					className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					<span className="flex items-center gap-1.5">
						<ScanSearch className="h-3.5 w-3.5" />
						Extraction Settings
					</span>
					<ChevronDown
						className={cn(
							"h-3.5 w-3.5 transition-transform",
							open && "rotate-180",
						)}
					/>
				</button>
			</div>

			{open && (
				<section
					className="absolute top-full right-0 left-0 z-30 mt-1 space-y-3 rounded-lg border bg-card p-3 shadow-lg"
					aria-label="Extraction options"
				>
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<Label htmlFor="enhanced-ocr" className="text-sm font-medium">
								Enhanced scan reading
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<p className="cursor-help text-left text-xs text-muted-foreground">
											Improves accuracy on scanned and handwritten documents
										</p>
									</TooltipTrigger>
									<TooltipContent side="bottom" className="max-w-[240px]">
										Uses Google Document AI OCR on scanned PDFs and images
										before AI extraction. Digital PDFs with readable text are
										processed locally.
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Switch
							id="enhanced-ocr"
							checked={value.enhancedOcr}
							onCheckedChange={(checked: boolean) =>
								onChange({ ...value, enhancedOcr: checked })
							}
						/>
					</div>

					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<Label htmlFor="force-ocr" className="text-sm font-medium">
								Use OCR on all documents
							</Label>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<p className="cursor-help text-left text-xs text-muted-foreground">
											Slower, slightly more accurate on digital PDFs
										</p>
									</TooltipTrigger>
									<TooltipContent side="bottom" className="max-w-[240px]">
										Forces cloud OCR on every document, including digital PDFs
										that already have readable text. Useful for forms with
										checkboxes or unusual layouts.
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<Switch
							id="force-ocr"
							checked={value.forceOcr}
							disabled={!value.enhancedOcr}
							onCheckedChange={(checked: boolean) =>
								onChange({ ...value, forceOcr: checked })
							}
						/>
					</div>
				</section>
			)}
		</div>
	);
}
