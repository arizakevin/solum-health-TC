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

export function getExtractionModelId(): string {
	return process.env.EXTRACTION_MODEL_ID ?? "gemini-3-flash-preview";
}

export function getAssistantModelId(): string {
	return process.env.ASSISTANT_MODEL_ID ?? "gemini-3-flash-preview";
}
