import { openaiLogprobsToConfidencePercent } from "@/lib/ai/logprobs-confidence";
import { getConfidenceModelId, getOpenAIClient } from "@/lib/ai/openai";

/**
 * Lightweight OpenAI verification pass: sends the already-extracted JSON to
 * GPT-4o-mini with `logprobs: true` and asks it to re-emit the data. The mean
 * token logprob of the response gives a calibrated extraction confidence score.
 *
 * Cost is negligible (~200-500 tokens round-trip, < $0.001 per call).
 * Returns null if OpenAI is not configured or the call fails.
 */
export async function runOpenAIConfidencePass(
	extractedJson: Record<string, unknown>,
): Promise<number | null> {
	try {
		const client = getOpenAIClient();
		const model = getConfidenceModelId();

		const jsonStr = JSON.stringify(extractedJson, null, 0);

		const response = await client.chat.completions.create({
			model,
			messages: [
				{
					role: "system",
					content:
						"You are a medical document extraction verifier. Given extracted fields from a healthcare form, re-emit the JSON exactly as provided. Do not add commentary.",
				},
				{
					role: "user",
					content: `Verify and re-emit this extracted data:\n${jsonStr}`,
				},
			],
			logprobs: true,
			top_logprobs: 3,
			temperature: 0,
			max_tokens: 4096,
			response_format: { type: "json_object" },
		});

		const choice = response.choices[0];
		const tokenLogprobs = choice?.logprobs?.content;

		return openaiLogprobsToConfidencePercent(tokenLogprobs);
	} catch (err) {
		console.warn(
			"[extraction] OpenAI confidence pass failed:",
			err instanceof Error ? err.message : err,
		);
		return null;
	}
}
