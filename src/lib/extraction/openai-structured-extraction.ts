import type { Part } from "@google/genai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/extraction-prompt";
import { openaiLogprobsToConfidencePercent } from "@/lib/ai/logprobs-confidence";
import { getOpenAIClient } from "@/lib/ai/openai";
import { geminiPartsToOpenAIUserContent } from "@/lib/extraction/gemini-parts-to-openai-user-content";
import type {
	GeminiStructuredExtractionErr,
	GeminiStructuredExtractionOk,
	GeminiStructuredExtractionResult,
} from "@/lib/extraction/gemini-structured-extraction";
import { getServiceRequestExtractionJsonSchema } from "@/lib/extraction/service-request-extraction-json-schema";
import { serviceRequestSchema } from "@/lib/types/service-request";

export type {
	GeminiStructuredExtractionResult as OpenAIStructuredExtractionResult,
};

/**
 * Structured extraction via OpenAI Chat Completions (JSON schema + logprobs).
 * Uses `strict: false` so optional fields (e.g. `source`) remain valid under OpenAI's strict-schema rules.
 */
export async function runOpenAIStructuredExtraction(
	parts: Part[],
	modelId: string,
): Promise<GeminiStructuredExtractionResult> {
	const schema = getServiceRequestExtractionJsonSchema();
	const userContent = geminiPartsToOpenAIUserContent(parts);
	if (userContent.length === 0) {
		const err: GeminiStructuredExtractionErr = {
			ok: false,
			error: "No user content built from document parts",
		};
		return err;
	}

	const client = getOpenAIClient();

	let response: ChatCompletion;
	try {
		response = await client.chat.completions.create({
			model: modelId,
			messages: [
				{ role: "system", content: EXTRACTION_SYSTEM_PROMPT },
				{ role: "user", content: userContent },
			],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "service_request_extraction",
					schema,
					strict: false,
				},
			},
			logprobs: true,
			top_logprobs: 3,
			temperature: 0.1,
			max_completion_tokens: 16384,
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		const err: GeminiStructuredExtractionErr = { ok: false, error: msg };
		return err;
	}

	const choice = response.choices[0];
	const responseText = choice?.message?.content?.trim() ?? "";
	const tokenLogprobs = choice?.logprobs?.content;
	const extractionConfidenceFromLogprobs =
		openaiLogprobsToConfidencePercent(tokenLogprobs);

	if (!responseText) {
		const err: GeminiStructuredExtractionErr = {
			ok: false,
			error: "Empty model response",
		};
		return err;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(responseText);
	} catch {
		const err: GeminiStructuredExtractionErr = {
			ok: false,
			error: "Failed to parse extraction response",
			raw: responseText,
		};
		return err;
	}

	const parsedExtraction = serviceRequestSchema.safeParse(parsed);
	if (!parsedExtraction.success) {
		const err: GeminiStructuredExtractionErr = {
			ok: false,
			error: `Schema validation failed: ${parsedExtraction.error.message}`,
			raw: responseText,
		};
		return err;
	}

	const ok: GeminiStructuredExtractionOk = {
		ok: true,
		extraction: parsedExtraction.data,
		extractionConfidenceFromLogprobs,
		responseText,
	};
	return ok;
}
