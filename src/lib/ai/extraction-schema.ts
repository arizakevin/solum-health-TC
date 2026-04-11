import { type Schema, Type } from "@google/genai";

const extractedFieldSchema: Schema = {
	type: Type.OBJECT,
	properties: {
		value: { type: Type.STRING },
		confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
		source: { type: Type.STRING },
	},
	required: ["value", "confidence"],
};

const arrayOfFields: Schema = {
	type: Type.ARRAY,
	items: extractedFieldSchema,
};

export const serviceRequestResponseSchema: Schema = {
	type: Type.OBJECT,
	properties: {
		header: {
			type: Type.OBJECT,
			properties: {
				payer: extractedFieldSchema,
				dateOfRequest: extractedFieldSchema,
				payerFax: extractedFieldSchema,
				payerPhone: extractedFieldSchema,
			},
			required: ["payer", "dateOfRequest", "payerFax", "payerPhone"],
		},
		sectionA: {
			type: Type.OBJECT,
			properties: {
				name: extractedFieldSchema,
				dob: extractedFieldSchema,
				gender: extractedFieldSchema,
				memberId: extractedFieldSchema,
				groupNumber: extractedFieldSchema,
				phone: extractedFieldSchema,
				address: extractedFieldSchema,
			},
			required: [
				"name",
				"dob",
				"gender",
				"memberId",
				"groupNumber",
				"phone",
				"address",
			],
		},
		sectionB: {
			type: Type.OBJECT,
			properties: {
				name: extractedFieldSchema,
				npi: extractedFieldSchema,
				facility: extractedFieldSchema,
				taxId: extractedFieldSchema,
				phone: extractedFieldSchema,
				fax: extractedFieldSchema,
				address: extractedFieldSchema,
			},
			required: ["name", "npi", "facility", "taxId", "phone", "fax", "address"],
		},
		sectionC: {
			type: Type.OBJECT,
			properties: {
				name: extractedFieldSchema,
				npi: extractedFieldSchema,
				phone: extractedFieldSchema,
			},
			required: ["name", "npi", "phone"],
		},
		sectionD: {
			type: Type.OBJECT,
			properties: {
				serviceType: extractedFieldSchema,
				serviceSetting: extractedFieldSchema,
				cptCodes: arrayOfFields,
				icd10Codes: arrayOfFields,
				diagnosisDescriptions: arrayOfFields,
				startDate: extractedFieldSchema,
				endDate: extractedFieldSchema,
				sessions: extractedFieldSchema,
				frequency: extractedFieldSchema,
			},
			required: [
				"serviceType",
				"serviceSetting",
				"cptCodes",
				"icd10Codes",
				"diagnosisDescriptions",
				"startDate",
				"endDate",
				"sessions",
				"frequency",
			],
		},
		sectionE: {
			type: Type.OBJECT,
			properties: {
				symptoms: extractedFieldSchema,
				clinicalHistory: extractedFieldSchema,
				medications: arrayOfFields,
				assessmentScores: arrayOfFields,
				treatmentGoals: extractedFieldSchema,
			},
			required: [
				"symptoms",
				"clinicalHistory",
				"medications",
				"assessmentScores",
				"treatmentGoals",
			],
		},
		sectionF: {
			type: Type.OBJECT,
			properties: {
				medicalNecessity: extractedFieldSchema,
				riskIfDenied: extractedFieldSchema,
			},
			required: ["medicalNecessity", "riskIfDenied"],
		},
		sectionG: {
			type: Type.OBJECT,
			properties: {
				providerSignature: extractedFieldSchema,
				printedName: extractedFieldSchema,
				date: extractedFieldSchema,
				licenseNumber: extractedFieldSchema,
			},
			required: ["providerSignature", "printedName", "date", "licenseNumber"],
		},
	},
	required: [
		"header",
		"sectionA",
		"sectionB",
		"sectionC",
		"sectionD",
		"sectionE",
		"sectionF",
		"sectionG",
	],
};
