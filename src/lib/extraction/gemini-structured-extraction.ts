import type { Content, Part } from "@google/genai";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/extraction-prompt";
import { serviceRequestResponseSchema } from "@/lib/ai/extraction-schema";
import { getGeminiClient } from "@/lib/ai/gemini";
import { avgLogprobsToExtractionConfidencePercent } from "@/lib/ai/logprobs-confidence";
import type { ServiceRequestExtraction } from "@/lib/types/service-request";

export type GeminiStructuredExtractionOk = {
	ok: true;
	extraction: ServiceRequestExtraction;
	extractionConfidenceFromLogprobs: number | null;
	responseText: string;
};

export type GeminiStructuredExtractionErr = {
	ok: false;
	error: string;
	raw?: string;
};

export type GeminiStructuredExtractionResult =
	| GeminiStructuredExtractionOk
	| GeminiStructuredExtractionErr;

/**
 * Single Gemini structured-output call (logprobs attempt, then plain fallback if unsupported).
 * Does not touch the database.
 */
export async function runGeminiStructuredExtraction(
	parts: Part[],
	modelId: string,
): Promise<GeminiStructuredExtractionResult> {
	const ai = getGeminiClient();
	const contents = [{ role: "user", parts }] as Content[];
	const baseConfig = {
		systemInstruction: EXTRACTION_SYSTEM_PROMPT,
		responseMimeType: "application/json" as const,
		responseSchema: serviceRequestResponseSchema,
		temperature: 0.1,
	};

	let response: Awaited<ReturnType<typeof ai.models.generateContent>>;
	let extractionConfidenceFromLogprobs: number | null = null;

	try {
		response = await ai.models.generateContent({
			model: modelId,
			contents,
			config: {
				...baseConfig,
				responseLogprobs: true,
				logprobs: 5,
			},
		});
		const rawLogprobs = response.candidates?.[0]?.avgLogprobs;
		if (rawLogprobs != null) {
			extractionConfidenceFromLogprobs =
				avgLogprobsToExtractionConfidencePercent(rawLogprobs);
		}
	} catch (firstErr) {
		const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
		const logprobsUnsupported =
			msg.includes("Logprobs is not enabled") ||
			(/logprob/i.test(msg) &&
				(/not enabled/i.test(msg) || /INVALID_ARGUMENT/i.test(msg)));
		if (!logprobsUnsupported) {
			return {
				ok: false,
				error: msg,
			};
		}
		response = await ai.models.generateContent({
			model: modelId,
			contents,
			config: baseConfig,
		});
	}

	const responseText = response.text ?? "";
	let extraction: ServiceRequestExtraction;

	try {
		extraction = JSON.parse(responseText) as ServiceRequestExtraction;
	} catch {
		return {
			ok: false,
			error: "Failed to parse extraction response",
			raw: responseText,
		};
	}

	return {
		ok: true,
		extraction,
		extractionConfidenceFromLogprobs,
		responseText,
	};
}
