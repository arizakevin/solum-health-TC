import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
	if (!_client) {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
		_client = new OpenAI({ apiKey });
	}
	return _client;
}

export function getConfidenceModelId(): string {
	return process.env.CONFIDENCE_MODEL_ID ?? "gpt-4o-mini";
}

/** Model for `EXTRACTION_PROVIDER=openai` (structured JSON + logprobs). */
export function getExtractionOpenAIModelId(override?: string | null): string {
	const t = override?.trim();
	if (t) return t;
	return process.env.EXTRACTION_OPENAI_MODEL_ID?.trim() || "gpt-4o-mini";
}

/** OpenAI chat model for `/api/assistant` (Annie). Must be an OpenAI model id. */
export function getAssistantOpenAIModelId(): string {
	return process.env.ASSISTANT_MODEL_ID?.trim() || "gpt-4o-mini";
}
