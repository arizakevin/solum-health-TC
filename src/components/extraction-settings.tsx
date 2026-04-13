"use client";

import { Popover } from "@base-ui/react/popover";
import { Settings2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useExtractionPreferencesStore } from "@/stores/extraction-preferences-store";

export interface ExtractionSettingsValues {
	enhancedOcr: boolean;
}

interface ExtractionSettingsFormProps {
	value: ExtractionSettingsValues;
	onChange: (next: ExtractionSettingsValues) => void;
	ocrAvailable: boolean;
	className?: string;
}

/** OCR + auto-extract toggles (used inside the header popover). */
export function ExtractionSettingsForm({
	value,
	onChange,
	ocrAvailable,
	className,
}: ExtractionSettingsFormProps) {
	const autoExtractOnUpload = useExtractionPreferencesStore(
		(s) => s.autoExtractOnUpload,
	);
	const setAutoExtractOnUpload = useExtractionPreferencesStore(
		(s) => s.setAutoExtractOnUpload,
	);

	return (
		<div className={cn("space-y-3", className)}>
			{ocrAvailable && (
				<>
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0 space-y-1">
							<Label htmlFor="cloud-ocr-scans" className="text-sm font-medium">
								Enhanced reading for scans & handwriting
							</Label>
							<p className="text-left text-xs text-muted-foreground">
								Improves accuracy on handwritten pages, photos of notes, and
								scanned PDFs where text is hard to select. May add a little
								processing time on those files.
							</p>
						</div>
						<Switch
							id="cloud-ocr-scans"
							checked={value.enhancedOcr}
							onCheckedChange={(checked: boolean) =>
								onChange({ enhancedOcr: checked })
							}
						/>
					</div>
					<Separator />
				</>
			)}

			{!ocrAvailable && (
				<p className="text-xs text-muted-foreground">
					Enhanced scan reading is not available in this environment — only the
					upload option below is shown here.
				</p>
			)}

			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<Label htmlFor="auto-extract-upload" className="text-sm font-medium">
						Auto-extract after upload
					</Label>
					<p className="text-xs text-muted-foreground">
						After every file in the current upload finishes, run extraction.
					</p>
				</div>
				<Switch
					id="auto-extract-upload"
					className="shrink-0"
					checked={autoExtractOnUpload}
					onCheckedChange={setAutoExtractOnUpload}
				/>
			</div>
		</div>
	);
}

interface ExtractionSettingsPopoverProps {
	value: ExtractionSettingsValues;
	onChange: (next: ExtractionSettingsValues) => void;
	ocrAvailable: boolean;
	/** Element id for guided tour anchoring (trigger button). */
	id?: string;
	/** Notified when the popover opens or closes (e.g. guided tour wait step). */
	onOpenChange?: (open: boolean) => void;
	/** When true (e.g. tour advanced past the settings step), closes the popover. */
	closeWhenTourPastSettings?: boolean;
	/** Called when the user clicks Done inside the popover (after close). */
	onDoneClick?: () => void;
}

export function ExtractionSettingsPopover({
	value,
	onChange,
	ocrAvailable,
	id,
	onOpenChange,
	closeWhenTourPastSettings = false,
	onDoneClick,
}: ExtractionSettingsPopoverProps) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!closeWhenTourPastSettings) return;
		setOpen(false);
		queueMicrotask(() => {
			onOpenChange?.(false);
		});
	}, [closeWhenTourPastSettings, onOpenChange]);

	const handleOpenChange = useCallback(
		(next: boolean) => {
			setOpen(next);
			onOpenChange?.(next);
		},
		[onOpenChange],
	);

	const handleDoneClick = useCallback(() => {
		onDoneClick?.();
		handleOpenChange(false);
	}, [handleOpenChange, onDoneClick]);

	return (
		<Popover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
			<Popover.Trigger
				id={id}
				render={
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Extraction settings"
						title="Extraction settings"
					>
						<Settings2 className="h-4 w-4" />
					</Button>
				}
			/>
			<Popover.Portal>
				<Popover.Positioner side="bottom" align="end" sideOffset={8}>
					<Popover.Popup
						id="tour-tutorial-extraction-settings-popup"
						className={cn(
							"z-50 w-[min(100vw-2rem,22rem)] origin-(--transform-origin) rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none ring-1 ring-foreground/10",
							"max-h-[min(70vh,28rem)] overflow-y-auto",
							"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
							"data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
						)}
					>
						<Popover.Title className="mb-3 text-sm font-semibold leading-none">
							Extraction settings
						</Popover.Title>
						<ExtractionSettingsForm
							value={value}
							onChange={onChange}
							ocrAvailable={ocrAvailable}
						/>
						<div className="mt-4 flex justify-end border-t pt-3">
							<Button type="button" size="sm" onClick={handleDoneClick}>
								Done
							</Button>
						</div>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}
