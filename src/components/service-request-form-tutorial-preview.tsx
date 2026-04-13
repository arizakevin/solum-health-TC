"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FormSection } from "@/components/form-section";
import {
	ALL_FORM_SECTION_IDS,
	SECTION_CONFIG,
} from "@/components/service-request-form";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { createEmptyServiceRequestExtraction } from "@/lib/service-request-empty";
import type {
	ExtractedField,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

interface ServiceRequestFormTutorialPreviewProps {
	/** When false, accordion panels collapse (e.g. after the user presses Next on the tour). */
	active: boolean;
}

export function ServiceRequestFormTutorialPreview({
	active,
}: ServiceRequestFormTutorialPreviewProps) {
	const [formData] = useState<ServiceRequestExtraction>(() =>
		createEmptyServiceRequestExtraction(),
	);
	const [openSections, setOpenSections] = useState<string[]>(() =>
		active ? ["sectionA"] : [],
	);

	useEffect(() => {
		if (active) {
			setOpenSections(["sectionA"]);
		} else {
			setOpenSections([]);
		}
	}, [active]);

	const anySectionOpen = openSections.length > 0;
	const allSectionsOpen = openSections.length === ALL_FORM_SECTION_IDS.length;
	const showOpenAll = !allSectionsOpen;
	const showCollapseAll = anySectionOpen;

	const noopChange = useCallback(
		(_fieldName: string, _value: string, _index?: number) => {},
		[],
	);

	const sections = useMemo(
		() =>
			SECTION_CONFIG.map((section) => (
				<FormSection
					key={section.id}
					id={section.id}
					title={section.title}
					fields={
						formData[section.key] as Record<
							string,
							ExtractedField | ExtractedField[]
						>
					}
					fieldLabels={section.labels as unknown as Record<string, string>}
					onFieldChange={noopChange}
				/>
			)),
		[formData, noopChange],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col text-card-foreground">
			{(showOpenAll || showCollapseAll) && (
				<div className="mb-2 flex shrink-0 flex-wrap justify-end gap-2">
					{showOpenAll && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setOpenSections([...ALL_FORM_SECTION_IDS])}
						>
							Open all
						</Button>
					)}
					{showCollapseAll && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setOpenSections([])}
						>
							Collapse all
						</Button>
					)}
				</div>
			)}
			<div className="min-h-0 flex-1 overflow-y-auto">
				<Accordion
					multiple
					value={openSections}
					onValueChange={setOpenSections}
					className="min-h-0"
				>
					{sections}
				</Accordion>
			</div>
		</div>
	);
}
