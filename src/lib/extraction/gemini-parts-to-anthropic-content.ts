import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages/messages";
import type { Part } from "@google/genai";

const SUPPORTED_IMAGE_MEDIA: ReadonlySet<string> = new Set([
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
]);

/**
 * Maps Gemini-style `Part[]` to Anthropic Messages API content blocks.
 * Unsupported image MIME types (e.g. TIFF) are omitted when no text sibling exists;
 * OCR/text parts from `buildExtractionPartsForCase` should still carry content.
 */
export function geminiPartsToAnthropicContent(
	parts: Part[],
): ContentBlockParam[] {
	const out: ContentBlockParam[] = [];
	for (const p of parts) {
		if ("text" in p && typeof p.text === "string" && p.text.length > 0) {
			out.push({ type: "text", text: p.text });
		}
		if ("inlineData" in p && p.inlineData?.data && p.inlineData.mimeType) {
			const { mimeType, data } = p.inlineData;
			if (mimeType === "application/pdf") {
				out.push({
					type: "document",
					source: {
						type: "base64",
						media_type: "application/pdf",
						data,
					},
				});
			} else if (SUPPORTED_IMAGE_MEDIA.has(mimeType)) {
				out.push({
					type: "image",
					source: {
						type: "base64",
						media_type: mimeType as
							| "image/jpeg"
							| "image/png"
							| "image/gif"
							| "image/webp",
						data,
					},
				});
			} else {
				out.push({
					type: "text",
					text: `\n[Omitted unsupported inline attachment type: ${mimeType}]`,
				});
			}
		}
	}
	return out;
}
