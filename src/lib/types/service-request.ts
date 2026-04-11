import { z } from "zod";

export const confidenceLevels = ["high", "medium", "low"] as const;
export type Confidence = (typeof confidenceLevels)[number];

export const extractedFieldSchema = z.object({
	value: z.string(),
	confidence: z.enum(confidenceLevels),
	source: z.string().optional(),
});

export type ExtractedField = z.infer<typeof extractedFieldSchema>;

export const serviceRequestSchema = z.object({
	header: z.object({
		payer: extractedFieldSchema,
		dateOfRequest: extractedFieldSchema,
		payerFax: extractedFieldSchema,
		payerPhone: extractedFieldSchema,
	}),
	sectionA: z.object({
		name: extractedFieldSchema,
		dob: extractedFieldSchema,
		gender: extractedFieldSchema,
		memberId: extractedFieldSchema,
		groupNumber: extractedFieldSchema,
		phone: extractedFieldSchema,
		address: extractedFieldSchema,
	}),
	sectionB: z.object({
		name: extractedFieldSchema,
		npi: extractedFieldSchema,
		facility: extractedFieldSchema,
		taxId: extractedFieldSchema,
		phone: extractedFieldSchema,
		fax: extractedFieldSchema,
		address: extractedFieldSchema,
	}),
	sectionC: z.object({
		name: extractedFieldSchema,
		npi: extractedFieldSchema,
		phone: extractedFieldSchema,
	}),
	sectionD: z.object({
		serviceType: extractedFieldSchema,
		serviceSetting: extractedFieldSchema,
		cptCodes: z.array(extractedFieldSchema),
		icd10Codes: z.array(extractedFieldSchema),
		diagnosisDescriptions: z.array(extractedFieldSchema),
		startDate: extractedFieldSchema,
		endDate: extractedFieldSchema,
		sessions: extractedFieldSchema,
		frequency: extractedFieldSchema,
	}),
	sectionE: z.object({
		symptoms: extractedFieldSchema,
		clinicalHistory: extractedFieldSchema,
		medications: z.array(extractedFieldSchema),
		assessmentScores: z.array(extractedFieldSchema),
		treatmentGoals: extractedFieldSchema,
	}),
	sectionF: z.object({
		medicalNecessity: extractedFieldSchema,
		riskIfDenied: extractedFieldSchema,
	}),
	sectionG: z.object({
		providerSignature: extractedFieldSchema,
		printedName: extractedFieldSchema,
		date: extractedFieldSchema,
		licenseNumber: extractedFieldSchema,
	}),
});

export type ServiceRequestExtraction = z.infer<typeof serviceRequestSchema>;

export const caseStatuses = [
	"Draft",
	"Extracting",
	"In Review",
	"Completed",
] as const;
export type CaseStatus = (typeof caseStatuses)[number];

export function confidenceToPercent(confidence: Confidence): number {
	switch (confidence) {
		case "high":
			return 95;
		case "medium":
			return 78;
		case "low":
			return 45;
	}
}

export function confidenceColor(confidence: Confidence): string {
	switch (confidence) {
		case "high":
			return "text-emerald-600";
		case "medium":
			return "text-amber-500";
		case "low":
			return "text-red-500";
	}
}

export function confidenceDotColor(confidence: Confidence): string {
	switch (confidence) {
		case "high":
			return "bg-emerald-500";
		case "medium":
			return "bg-amber-500";
		case "low":
			return "bg-red-500";
	}
}
