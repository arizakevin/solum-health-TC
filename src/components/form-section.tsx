"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { FormField } from "@/components/form-field";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { ExtractedField } from "@/lib/types/service-request";

function fieldHasValue(f: ExtractedField): boolean {
	return f.value.trim().length > 0;
}

function computeSectionStatus(
	fields: Record<string, ExtractedField | ExtractedField[]>,
	fieldLabels: Record<string, string>,
): { filled: number; total: number } {
	let filled = 0;
	let total = 0;
	for (const key of Object.keys(fieldLabels)) {
		const data = fields[key];
		if (Array.isArray(data)) {
			if (data.length === 0) {
				total += 1;
			} else {
				for (const item of data) {
					total += 1;
					if (fieldHasValue(item)) filled += 1;
				}
			}
		} else if (data) {
			total += 1;
			if (fieldHasValue(data)) filled += 1;
		} else {
			total += 1;
		}
	}
	return { filled, total };
}

interface FormSectionProps {
	id: string;
	title: string;
	fields: Record<string, ExtractedField | ExtractedField[]>;
	fieldLabels: Record<string, string>;
	onFieldChange: (fieldName: string, value: string, index?: number) => void;
}

export function FormSection({
	id,
	title,
	fields,
	fieldLabels,
	onFieldChange,
}: FormSectionProps) {
	const { filled, total } = useMemo(
		() => computeSectionStatus(fields, fieldLabels),
		[fields, fieldLabels],
	);

	const isComplete = filled === total && total > 0;
	const missing = total - filled;

	return (
		<AccordionItem value={id}>
			<AccordionTrigger className="text-sm font-semibold">
				<span className="flex items-center gap-2">
					{title}
					{isComplete ? (
						<CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
					) : (
						<span className="flex items-center gap-1 text-xs font-normal text-amber-500">
							<AlertCircle className="h-3.5 w-3.5 shrink-0" />
							{missing} missing
						</span>
					)}
				</span>
			</AccordionTrigger>
			<AccordionContent>
				<div className="grid gap-3 sm:grid-cols-2">
					{Object.entries(fieldLabels).map(([key, label]) => {
						const fieldData = fields[key];

						if (Array.isArray(fieldData)) {
							return (
								<div key={key} className="col-span-2 space-y-1">
									<p className="text-xs font-medium text-muted-foreground">
										{label}
									</p>
									{fieldData.length === 0 ? (
										<p className="text-sm italic text-muted-foreground">
											None extracted
										</p>
									) : (
										fieldData.map((item, i) => (
											<FormField
												key={`${key}-${i}`}
												label={`${label} #${i + 1}`}
												value={item.value}
												confidence={item.confidence}
												source={item.source}
												onChange={(v) => onFieldChange(key, v, i)}
											/>
										))
									)}
								</div>
							);
						}

						const field = fieldData as ExtractedField | undefined;
						return (
							<FormField
								key={key}
								label={label}
								value={field?.value ?? ""}
								confidence={field?.confidence ?? "low"}
								source={field?.source}
								onChange={(v) => onFieldChange(key, v)}
							/>
						);
					})}
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
