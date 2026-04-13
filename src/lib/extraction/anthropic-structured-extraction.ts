import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages/messages";
import type { Part } from "@google/genai";
import { getAnthropicClient } from "@/lib/ai/anthropic";
import { EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/extraction-prompt";
import { geminiPartsToAnthropicContent } from "@/lib/extraction/gemini-parts-to-anthropic-content";
import type {
	GeminiStructuredExtractionErr,
	GeminiStructuredExtractionOk,
	GeminiStructuredExtractionResult,
} from "@/lib/extraction/gemini-structured-extraction";
import { serviceRequestSchema } from "@/lib/types/service-request";

const JSON_ONLY_CLOSER = `

Return a single JSON object only (no markdown fences, no commentary) that matches the service request extraction shape described in the system prompt: root keys header, sectionA … sectionG; each scalar field is { "value", "confidence", "source?" } with confidence one of "high"|"medium"|"low"; array fields are arrays of those objects. Use "" for missing values where appropriate.`;

/**
 * Parses a model reply that should contain one JSON object (optional ```json fence).
 */
function parseJsonObjectFromText(raw: string): unknown {
	const t = raw.trim();
	const fenced = /^```(?:json)?\s*([\s\S]*?)```/m.exec(t);
	if (fenced?.[1]) {
		return JSON.parse(fenced[1].trim()) as unknown;
	}
	const start = t.indexOf("{");
	const end = t.lastIndexOf("}");
	if (start >= 0 && end > start) {
		return JSON.parse(t.slice(start, end + 1)) as unknown;
	}
	return JSON.parse(t) as unknown;
}

/**
 * Extraction via Anthropic Messages API using **plain JSON in text** (no
 * `output_config.format` json_schema): the full form schema is too large for
 * Anthropic’s constrained “structured outputs” grammar, and some model ids
 * do not support that mode. Output is validated with Zod after the call.
 */
export async function runAnthropicStructuredExtraction(
	parts: Part[],
	modelId: string,
): Promise<GeminiStructuredExtractionResult> {
	const docBlocks = geminiPartsToAnthropicContent(parts);
	if (docBlocks.length === 0) {
		const err: GeminiStructuredExtractionErr = {
			ok: false,
			error: "No user content built from document parts",
		};
		return err;
	}

	const userContent: ContentBlockParam[] = [
		...docBlocks,
		{ type: "text", text: JSON_ONLY_CLOSER.trimStart() },
	];

	/** SDK non-streaming cap for Opus ids; sufficient for our JSON payload. */
	const maxOut = 8192;

	try {
		const client = getAnthropicClient();
		const message = await client.messages.create({
			model: modelId,
			max_tokens: maxOut,
			system: EXTRACTION_SYSTEM_PROMPT,
			messages: [{ role: "user", content: userContent }],
			temperature: 0.1,
		});

		const textBlock = message.content.find((b) => b.type === "text");
		const responseText =
			textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

		if (!responseText) {
			const err: GeminiStructuredExtractionErr = {
				ok: false,
				error: "Empty model response",
			};
			return err;
		}

		let parsed: unknown;
		try {
			parsed = parseJsonObjectFromText(responseText);
		} catch {
			const err: GeminiStructuredExtractionErr = {
				ok: false,
				error: "Failed to parse extraction response as JSON",
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
			extractionConfidenceFromLogprobs: null,
			responseText,
		};
		return ok;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		const err: GeminiStructuredExtractionErr = { ok: false, error: msg };
		return err;
	}
}
