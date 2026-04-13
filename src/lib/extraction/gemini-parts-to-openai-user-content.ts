import type { Part } from "@google/genai";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

/**
 * Maps Gemini-style multimodal `Part[]` (from `buildExtractionPartsForCase`) to
 * OpenAI Chat Completions user message content parts.
 */
export function geminiPartsToOpenAIUserContent(
	parts: Part[],
): ChatCompletionContentPart[] {
	const out: ChatCompletionContentPart[] = [];
	for (const p of parts) {
		if ("text" in p && typeof p.text === "string" && p.text.length > 0) {
			out.push({ type: "text", text: p.text });
		}
		if ("inlineData" in p && p.inlineData?.data && p.inlineData.mimeType) {
			const { mimeType, data } = p.inlineData;
			if (mimeType === "application/pdf") {
				out.push({
					type: "file",
					file: {
						filename: "document.pdf",
						file_data: `data:application/pdf;base64,${data}`,
					},
				});
			} else if (mimeType.startsWith("image/")) {
				out.push({
					type: "image_url",
					image_url: { url: `data:${mimeType};base64,${data}` },
				});
			} else {
				out.push({
					type: "file",
					file: {
						filename: "attachment",
						file_data: `data:${mimeType};base64,${data}`,
					},
				});
			}
		}
	}
	return out;
}
