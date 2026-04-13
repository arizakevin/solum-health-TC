import type {
	ExtractedField,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

const emptyField = (): ExtractedField => ({
	value: "",
	confidence: "low",
});

/** Valid empty extraction for read-only UI previews (e.g. guided tour). */
export function createEmptyServiceRequestExtraction(): ServiceRequestExtraction {
	return {
		isValidDocument: true,
		header: {
			payer: emptyField(),
			dateOfRequest: emptyField(),
			payerFax: emptyField(),
			payerPhone: emptyField(),
		},
		sectionA: {
			name: emptyField(),
			dob: emptyField(),
			gender: emptyField(),
			memberId: emptyField(),
			groupNumber: emptyField(),
			phone: emptyField(),
			address: emptyField(),
		},
		sectionB: {
			name: emptyField(),
			npi: emptyField(),
			facility: emptyField(),
			taxId: emptyField(),
			phone: emptyField(),
			fax: emptyField(),
			address: emptyField(),
		},
		sectionC: {
			name: emptyField(),
			npi: emptyField(),
			phone: emptyField(),
		},
		sectionD: {
			serviceType: emptyField(),
			serviceSetting: emptyField(),
			cptCodes: [],
			icd10Codes: [],
			diagnosisDescriptions: [],
			startDate: emptyField(),
			endDate: emptyField(),
			sessions: emptyField(),
			frequency: emptyField(),
		},
		sectionE: {
			symptoms: emptyField(),
			clinicalHistory: emptyField(),
			medications: [],
			assessmentScores: [],
			treatmentGoals: emptyField(),
		},
		sectionF: {
			medicalNecessity: emptyField(),
			riskIfDenied: emptyField(),
		},
		sectionG: {
			providerSignature: emptyField(),
			printedName: emptyField(),
			date: emptyField(),
			licenseNumber: emptyField(),
		},
	};
}
