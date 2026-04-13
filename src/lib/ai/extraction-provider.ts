export type ExtractionProvider = "openai" | "gemini" | "anthropic";

/**
 * Primary structured extraction backend.
 * Default `openai` uses logprobs-capable models for case-level confidence without a second model pass.
 */
export function getExtractionProvider(): ExtractionProvider {
	const v = process.env.EXTRACTION_PROVIDER?.trim().toLowerCase();
	if (v === "gemini" || v === "google") return "gemini";
	if (v === "anthropic" || v === "claude") return "anthropic";
	return "openai";
}
