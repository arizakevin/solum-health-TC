import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
	if (!_client) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
		_client = new GoogleGenAI({ apiKey });
	}
	return _client;
}

/** Gemini model id when `EXTRACTION_PROVIDER=gemini`. Reads `EXTRACTION_GEMINI_MODEL_ID`; `EXTRACTION_MODEL_ID` is a deprecated alias. */
export function getExtractionModelId(override?: string | null): string {
	const t = override?.trim();
	if (t) return t;
	const id =
		process.env.EXTRACTION_GEMINI_MODEL_ID?.trim() ||
		process.env.EXTRACTION_MODEL_ID?.trim();
	return id || "gemini-3-flash-preview";
}
