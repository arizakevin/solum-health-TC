import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
	if (!_client) {
		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
		_client = new Anthropic({ apiKey });
	}
	return _client;
}

/** Default extraction model when `EXTRACTION_PROVIDER=anthropic`. */
export function getExtractionAnthropicModelId(
	override?: string | null,
): string {
	const t = override?.trim();
	if (t) return t;
	return (
		process.env.EXTRACTION_ANTHROPIC_MODEL_ID?.trim() ||
		"claude-haiku-4-5-20251001"
	);
}
