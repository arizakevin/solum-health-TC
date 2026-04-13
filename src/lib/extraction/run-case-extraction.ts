import type { SupabaseClient } from "@supabase/supabase-js";
import { getExtractionAnthropicModelId } from "@/lib/ai/anthropic";
import { getExtractionProvider } from "@/lib/ai/extraction-provider";
import { getExtractionModelId } from "@/lib/ai/gemini";
import { getExtractionOpenAIModelId } from "@/lib/ai/openai";
import { runOpenAIConfidencePass } from "@/lib/ai/openai-confidence-pass";
import { runAnthropicStructuredExtraction } from "@/lib/extraction/anthropic-structured-extraction";
import { buildExtractionPartsForCase } from "@/lib/extraction/build-extraction-parts";
import type { GeminiStructuredExtractionResult } from "@/lib/extraction/gemini-structured-extraction";
import { runGeminiStructuredExtraction } from "@/lib/extraction/gemini-structured-extraction";
import { runOpenAIStructuredExtraction } from "@/lib/extraction/openai-structured-extraction";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type {
	Confidence,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

export type ConfidenceFollowUp = "none" | "openai";

export interface ExtractionOptions {
	/** Enable Document AI OCR for scanned/handwritten docs (default: true when configured) */
	enhancedOcr?: boolean;
	/** Force OCR on all PDFs including rich-text (default: false) */
	forceOcr?: boolean;
	/** Internal: override primary extraction model ID for the active provider (benchmarks / scripts). */
	modelOverride?: string;
}

export type RunCaseExtractionResult =
	| {
			ok: true;
			fieldCount: number;
			extraction: ServiceRequestExtraction;
			confidenceFollowUp: ConfidenceFollowUp;
	  }
	| {
			ok: false;
			status: number;
			error: string;
			details?: string;
			raw?: string;
	  };

function syncOpenAiConfidenceEnabled(): boolean {
	return process.env.EXTRACTION_SYNC_OPENAI_CONFIDENCE === "true";
}

/** Counts flattened extraction field rows (same logic as Prisma createMany). */
export function countFlattenedExtractionFields(
	extraction: ServiceRequestExtraction,
): number {
	let n = 0;
	for (const [, sectionData] of Object.entries(extraction)) {
		if (typeof sectionData !== "object" || sectionData === null) continue;
		for (const [, fieldData] of Object.entries(
			sectionData as Record<string, unknown>,
		)) {
			if (Array.isArray(fieldData)) {
				n += fieldData.length;
			} else if (
				typeof fieldData === "object" &&
				fieldData !== null &&
				"value" in fieldData
			) {
				n += 1;
			}
		}
	}
	return n;
}

/**
 * Runs the extraction pipeline for a case (Supabase storage + LLM + Prisma).
 * Use from Server Actions or Route Handlers — not via server-side `fetch` to `/api/extract`,
 * which does not carry the user session and will be redirected by `proxy` to HTML sign-in.
 */
export async function runCaseExtraction(
	caseId: string,
	options: ExtractionOptions = {},
): Promise<RunCaseExtractionResult> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, status: 401, error: "Not authenticated" };
	}

	const owned = await prisma.case.findFirst({
		where: { id: caseId, userId: user.id },
		select: { id: true },
	});
	if (!owned) {
		return { ok: false, status: 404, error: "Case not found" };
	}

	return runCaseExtractionPipeline(caseId, options, supabase);
}

/**
 * Runs download → OCR (optional) → structured extraction (OpenAI / Gemini / Anthropic) → Prisma for a case.
 * Pass a Supabase client with storage access (user session or service role for scripts).
 */
export async function runCaseExtractionPipeline(
	caseId: string,
	options: ExtractionOptions,
	supabase: SupabaseClient,
): Promise<RunCaseExtractionResult> {
	try {
		await prisma.case.update({
			where: { id: caseId },
			data: { status: "Extracting" },
		});

		const documents = await prisma.document.findMany({
			where: { caseId },
		});

		if (documents.length === 0) {
			return {
				ok: false,
				status: 400,
				error: "No documents found for this case",
			};
		}

		const parts = await buildExtractionPartsForCase(
			caseId,
			documents,
			supabase,
			{
				enhancedOcr: options.enhancedOcr,
				forceOcr: options.forceOcr,
			},
		);

		const provider = getExtractionProvider();
		let structuredResult: GeminiStructuredExtractionResult;
		if (provider === "openai") {
			if (!process.env.OPENAI_API_KEY?.trim()) {
				return {
					ok: false,
					status: 500,
					error:
						"OPENAI_API_KEY is not set (required for EXTRACTION_PROVIDER=openai)",
				};
			}
			const modelId = getExtractionOpenAIModelId(options.modelOverride ?? null);
			structuredResult = await runOpenAIStructuredExtraction(parts, modelId);
		} else if (provider === "anthropic") {
			if (!process.env.ANTHROPIC_API_KEY?.trim()) {
				return {
					ok: false,
					status: 500,
					error:
						"ANTHROPIC_API_KEY is not set (required for EXTRACTION_PROVIDER=anthropic)",
				};
			}
			const modelId = getExtractionAnthropicModelId(
				options.modelOverride ?? null,
			);
			structuredResult = await runAnthropicStructuredExtraction(parts, modelId);
		} else {
			if (!process.env.GEMINI_API_KEY?.trim()) {
				return {
					ok: false,
					status: 500,
					error:
						"GEMINI_API_KEY is not set (required for EXTRACTION_PROVIDER=gemini)",
				};
			}
			const modelId = getExtractionModelId(options.modelOverride ?? null);
			structuredResult = await runGeminiStructuredExtraction(parts, modelId);
		}

		if (!structuredResult.ok) {
			return {
				ok: false,
				status: 500,
				error: structuredResult.error,
				raw: structuredResult.raw,
			};
		}

		const { extraction, extractionConfidenceFromLogprobs } = structuredResult;

		if (
			"isValidDocument" in extraction &&
			extraction.isValidDocument === false
		) {
			await prisma.case.update({
				where: { id: caseId },
				data: { status: "Draft" }, // Revert to Draft instead of failing permanently.
			});
			return {
				ok: false,
				status: 400,
				error: "Invalid Document",
				details:
					(extraction as { rejectionReason?: string }).rejectionReason ||
					"The document was analyzed and deemed irrelevant to a medical service request context.",
			};
		}

		let extractionConfidence: number | null = extractionConfidenceFromLogprobs;
		let confidenceFollowUp: ConfidenceFollowUp = "none";

		if (extractionConfidence == null && process.env.OPENAI_API_KEY) {
			if (syncOpenAiConfidenceEnabled()) {
				extractionConfidence = await runOpenAIConfidencePass(
					extraction as unknown as Record<string, unknown>,
				);
			} else {
				confidenceFollowUp = "openai";
			}
		}

		await prisma.extractionField.deleteMany({ where: { caseId } });

		const fieldRecords: {
			caseId: string;
			section: string;
			fieldName: string;
			autoValue: string;
			finalValue: string;
			confidence: string;
		}[] = [];

		for (const [sectionKey, sectionData] of Object.entries(extraction)) {
			if (typeof sectionData !== "object" || sectionData === null) continue;

			for (const [fieldKey, fieldData] of Object.entries(
				sectionData as Record<string, unknown>,
			)) {
				if (Array.isArray(fieldData)) {
					for (const item of fieldData) {
						const f = item as { value: string; confidence: Confidence };
						fieldRecords.push({
							caseId,
							section: sectionKey,
							fieldName: fieldKey,
							autoValue: f.value ?? "",
							finalValue: f.value ?? "",
							confidence: f.confidence ?? "low",
						});
					}
				} else if (
					typeof fieldData === "object" &&
					fieldData !== null &&
					"value" in fieldData
				) {
					const f = fieldData as { value: string; confidence: Confidence };
					fieldRecords.push({
						caseId,
						section: sectionKey,
						fieldName: fieldKey,
						autoValue: f.value ?? "",
						finalValue: f.value ?? "",
						confidence: f.confidence ?? "low",
					});
				}
			}
		}

		if (fieldRecords.length > 0) {
			await prisma.extractionField.createMany({ data: fieldRecords });
		}

		const extractedName =
			(
				extraction as unknown as Record<
					string,
					Record<string, { value?: string }> | undefined
				>
			)?.sectionA?.name?.value || null;

		await prisma.case.update({
			where: { id: caseId },
			data: {
				status: "In Review",
				rawExtraction: JSON.parse(JSON.stringify(extraction)),
				finalFormData: JSON.parse(JSON.stringify(extraction)),
				extractionConfidence,
				patientName: extractedName,
			},
		});

		return {
			ok: true,
			fieldCount: fieldRecords.length,
			extraction,
			confidenceFollowUp,
		};
	} catch (error) {
		console.error("Extraction error:", error);
		return {
			ok: false,
			status: 500,
			error: "Extraction failed",
			details: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
