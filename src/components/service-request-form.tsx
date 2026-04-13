"use client";

import { FileCheck, Save } from "lucide-react";
import { useCallback, useState } from "react";
import { FormSection } from "@/components/form-section";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type {
	ExtractedField,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

const SECTION_CONFIG = [
	{
		id: "header",
		title: "Header",
		key: "header" as const,
		labels: {
			payer: "Payer",
			dateOfRequest: "Date of Request",
			payerFax: "Payer Fax",
			payerPhone: "Payer Phone",
		},
	},
	{
		id: "sectionA",
		title: "A — Member Information",
		key: "sectionA" as const,
		labels: {
			name: "Member Name",
			dob: "Date of Birth",
			gender: "Gender",
			memberId: "Member ID",
			groupNumber: "Group Number",
			phone: "Phone",
			address: "Address",
		},
	},
	{
		id: "sectionB",
		title: "B — Requesting Provider",
		key: "sectionB" as const,
		labels: {
			name: "Provider Name",
			npi: "NPI",
			facility: "Facility",
			taxId: "Tax ID",
			phone: "Phone",
			fax: "Fax",
			address: "Address",
		},
	},
	{
		id: "sectionC",
		title: "C — Referring Provider",
		key: "sectionC" as const,
		labels: {
			name: "Provider Name",
			npi: "NPI",
			phone: "Phone",
		},
	},
	{
		id: "sectionD",
		title: "D — Service Information",
		key: "sectionD" as const,
		labels: {
			serviceType: "Service Type",
			serviceSetting: "Service Setting",
			cptCodes: "CPT Codes",
			icd10Codes: "ICD-10 Codes",
			diagnosisDescriptions: "Diagnosis Descriptions",
			startDate: "Start Date",
			endDate: "End Date",
			sessions: "Sessions",
			frequency: "Frequency",
		},
	},
	{
		id: "sectionE",
		title: "E — Clinical Information",
		key: "sectionE" as const,
		labels: {
			symptoms: "Symptoms",
			clinicalHistory: "Clinical History",
			medications: "Medications",
			assessmentScores: "Assessment Scores",
			treatmentGoals: "Treatment Goals",
		},
	},
	{
		id: "sectionF",
		title: "F — Justification",
		key: "sectionF" as const,
		labels: {
			medicalNecessity: "Medical Necessity",
			riskIfDenied: "Risk if Denied",
		},
	},
	{
		id: "sectionG",
		title: "G — Attestation",
		key: "sectionG" as const,
		labels: {
			providerSignature: "Provider Signature",
			printedName: "Printed Name",
			date: "Date",
			licenseNumber: "License Number",
		},
	},
] as const;

interface ServiceRequestFormProps {
	extraction: ServiceRequestExtraction;
	onSave: (data: ServiceRequestExtraction) => Promise<void>;
	onApprove: (data: ServiceRequestExtraction) => Promise<void>;
}

export function ServiceRequestForm({
	extraction,
	onSave,
	onApprove,
}: ServiceRequestFormProps) {
	const [formData, setFormData] =
		useState<ServiceRequestExtraction>(extraction);
	const [isSaving, setIsSaving] = useState(false);
	const [isApproving, setIsApproving] = useState(false);

	const handleFieldChange = useCallback(
		(sectionKey: string, fieldName: string, value: string, index?: number) => {
			setFormData((prev) => {
				const newData = JSON.parse(
					JSON.stringify(prev),
				) as ServiceRequestExtraction;
				const section = newData[
					sectionKey as keyof ServiceRequestExtraction
				] as Record<string, ExtractedField | ExtractedField[]>;

				if (typeof index === "number" && Array.isArray(section[fieldName])) {
					(section[fieldName] as ExtractedField[])[index].value = value;
				} else if (section[fieldName] && !Array.isArray(section[fieldName])) {
					(section[fieldName] as ExtractedField).value = value;
				}

				return newData;
			});
		},
		[],
	);

	async function handleSave() {
		setIsSaving(true);
		try {
			await onSave(formData);
		} finally {
			setIsSaving(false);
		}
	}

	async function handleApprove() {
		setIsApproving(true);
		try {
			await onApprove(formData);
		} finally {
			setIsApproving(false);
		}
	}

	return (
		<div className="flex h-full min-h-0 flex-col gap-3">
			<div className="min-h-0 flex-1 overflow-y-auto">
				<Accordion defaultValue={[0, 1]} className="min-h-0">
					{SECTION_CONFIG.map((section) => (
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
							onFieldChange={(fieldName, value, index) =>
								handleFieldChange(section.key, fieldName, value, index)
							}
						/>
					))}
				</Accordion>
			</div>

			<div className="flex shrink-0 flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
				<Button
					variant="outline"
					onClick={handleSave}
					disabled={isSaving}
					className="w-full sm:w-auto"
				>
					<Save className="mr-2 h-4 w-4" />
					{isSaving ? "Saving..." : "Save Draft"}
				</Button>
				<Button
					id="btn-approve-pdf"
					onClick={handleApprove}
					disabled={isApproving}
					className="w-full sm:w-auto"
				>
					<FileCheck className="mr-2 h-4 w-4" />
					{isApproving ? "Generating..." : "Approve & Generate PDF →"}
				</Button>
			</div>
		</div>
	);
}
