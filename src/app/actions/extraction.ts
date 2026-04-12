"use server";

import { revalidatePath } from "next/cache";
import {
	type ExtractionOptions,
	runCaseExtraction,
} from "@/lib/extraction/run-case-extraction";
import { prisma } from "@/lib/prisma";
import type { ServiceRequestExtraction } from "@/lib/types/service-request";

export async function saveFormDraft(
	caseId: string,
	formData: ServiceRequestExtraction,
) {
	const existingCase = await prisma.case.findUnique({
		where: { id: caseId },
		include: { extractionFields: true },
	});

	if (!existingCase) throw new Error("Case not found");

	for (const field of existingCase.extractionFields) {
		const sectionData = formData[
			field.section as keyof ServiceRequestExtraction
		] as Record<string, { value: string } | { value: string }[]> | undefined;
		if (!sectionData) continue;

		const fieldData = sectionData[field.fieldName];
		if (!fieldData) continue;

		const newValue = Array.isArray(fieldData)
			? fieldData.map((f) => f.value).join(", ")
			: fieldData.value;

		const wasCorrected = newValue !== field.autoValue;

		await prisma.extractionField.update({
			where: { id: field.id },
			data: {
				finalValue: newValue,
				wasCorrected,
			},
		});
	}

	await prisma.case.update({
		where: { id: caseId },
		data: {
			finalFormData: JSON.parse(JSON.stringify(formData)),
		},
	});

	revalidatePath(`/case/${caseId}`);
}

export async function approveAndGeneratePdf(
	caseId: string,
	formData: ServiceRequestExtraction,
) {
	await saveFormDraft(caseId, formData);

	await prisma.case.update({
		where: { id: caseId },
		data: { status: "Completed" },
	});

	revalidatePath(`/case/${caseId}`);
	revalidatePath("/");
}

export async function triggerExtraction(
	caseId: string,
	options?: ExtractionOptions,
) {
	const result = await runCaseExtraction(caseId, options);

	if (!result.ok) {
		const msg = result.details
			? `${result.error}: ${result.details}`
			: result.error;
		throw new Error(msg);
	}

	revalidatePath(`/case/${caseId}`);
	revalidatePath("/");

	return {
		success: true as const,
		fieldCount: result.fieldCount,
		extraction: result.extraction,
	};
}
