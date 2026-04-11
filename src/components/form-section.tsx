"use client";

import { FormField } from "@/components/form-field";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { ExtractedField } from "@/lib/types/service-request";

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
	return (
		<AccordionItem value={id}>
			<AccordionTrigger className="text-sm font-semibold">
				{title}
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
