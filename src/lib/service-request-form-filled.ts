import type {
	ExtractedField,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

function fieldHasText(f: ExtractedField): boolean {
	return f.value.trim() !== "";
}

function valueHasFilledContent(
	value: ExtractedField | ExtractedField[],
): boolean {
	if (Array.isArray(value)) {
		return value.some((item) => fieldHasText(item));
	}
	return fieldHasText(value);
}

/** True if any form field has a non-empty trimmed value (ignores confidence / source). */
export function serviceRequestFormHasAnyFilledValue(
	data: ServiceRequestExtraction,
): boolean {
	const sections: (keyof ServiceRequestExtraction)[] = [
		"header",
		"sectionA",
		"sectionB",
		"sectionC",
		"sectionD",
		"sectionE",
		"sectionF",
		"sectionG",
	];
	for (const key of sections) {
		const section = data[key] as Record<
			string,
			ExtractedField | ExtractedField[]
		>;
		for (const v of Object.values(section)) {
			if (valueHasFilledContent(v)) return true;
		}
	}
	return false;
}
