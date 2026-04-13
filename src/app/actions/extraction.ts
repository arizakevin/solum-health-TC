"use server";

import { revalidatePath } from "next/cache";
import { runOpenAIConfidencePass } from "@/lib/ai/openai-confidence-pass";
import { arrayDiffers, scalarDiffers } from "@/lib/corrections/compare-values";
import { extractionFieldGroupKey } from "@/lib/corrections/field-group";
import {
	type ExtractionOptions,
	runCaseExtraction,
} from "@/lib/extraction/run-case-extraction";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
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

	const byGroup = new Map<string, typeof existingCase.extractionFields>();
	for (const field of existingCase.extractionFields) {
		const key = extractionFieldGroupKey(field.section, field.fieldName);
		const list = byGroup.get(key);
		if (list) list.push(field);
		else byGroup.set(key, [field]);
	}

	for (const rows of byGroup.values()) {
		rows.sort((a, b) => a.id.localeCompare(b.id));
		const first = rows[0];
		const sectionData = formData[
			first.section as keyof ServiceRequestExtraction
		] as Record<string, { value: string } | { value: string }[]> | undefined;
		if (!sectionData) continue;

		const fieldData = sectionData[first.fieldName];
		if (!fieldData) continue;

		const isArray = Array.isArray(fieldData);
		const wasCorrected = isArray
			? arrayDiffers(
					fieldData.map((f) => f.value),
					rows.map((r) => r.autoValue ?? ""),
				)
			: scalarDiffers(fieldData.value, rows[0].autoValue ?? "");

		if (isArray) {
			for (let i = 0; i < rows.length; i++) {
				await prisma.extractionField.update({
					where: { id: rows[i].id },
					data: {
						finalValue: fieldData[i]?.value ?? "",
						wasCorrected,
					},
				});
			}
		} else {
			for (const row of rows) {
				await prisma.extractionField.update({
					where: { id: row.id },
					data: {
						finalValue: fieldData.value,
						wasCorrected,
					},
				});
			}
		}
	}

	const patientName =
		(formData.sectionA as Record<string, { value?: string }> | undefined)?.name
			?.value || null;

	await prisma.case.update({
		where: { id: caseId },
		data: {
			finalFormData: JSON.parse(JSON.stringify(formData)),
			patientName,
		},
	});

	revalidatePath(`/case/${caseId}`);
	revalidatePath("/metrics");
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
		confidenceFollowUp: result.confidenceFollowUp,
	};
}

export type FinalizeExtractionConfidenceResult =
	| { ok: true; skipped: true; reason: "already_set" | "no_openai" }
	| { ok: true; skipped: false; score: number }
	| { ok: false; error: string };

/**
 * Fills `Case.extractionConfidence` when extraction used deferred OpenAI scoring.
 * Idempotent if a score is already stored.
 */
export async function finalizeExtractionConfidence(
	caseId: string,
): Promise<FinalizeExtractionConfidenceResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Not authenticated" };
	}

	const owned = await prisma.case.findFirst({
		where: { id: caseId, userId: user.id },
		select: { id: true, extractionConfidence: true, rawExtraction: true },
	});

	if (!owned) {
		return { ok: false, error: "Case not found" };
	}

	if (owned.extractionConfidence != null) {
		return { ok: true, skipped: true, reason: "already_set" };
	}

	if (!process.env.OPENAI_API_KEY) {
		return { ok: true, skipped: true, reason: "no_openai" };
	}

	const raw = owned.rawExtraction as unknown as Record<string, unknown> | null;
	if (!raw) {
		return { ok: false, error: "No raw extraction to score" };
	}

	const score = await runOpenAIConfidencePass(raw);
	if (score == null) {
		return { ok: false, error: "Confidence pass returned no score" };
	}

	await prisma.case.update({
		where: { id: caseId },
		data: { extractionConfidence: score },
	});

	revalidatePath(`/case/${caseId}`);
	revalidatePath("/metrics");

	return { ok: true, skipped: false, score };
}
