/**
 * Maps Gemini `Candidate.avgLogprobs` (length-normalized average log probability of
 * generated tokens) to a 0–100 extraction confidence percentage.
 *
 * See `docs/extraction-confidence.md`.
 */
export function avgLogprobsToExtractionConfidencePercent(
	avgLogprobs: number | null | undefined,
): number | null {
	if (avgLogprobs == null || Number.isNaN(avgLogprobs)) return null;
	const linear = Math.exp(avgLogprobs) * 100;
	if (!Number.isFinite(linear)) return null;
	return Math.min(100, Math.max(0, linear));
}

/**
 * Maps an array of OpenAI token-level logprobs to a 0–100 confidence percentage.
 * Computes the mean logprob across all tokens, then converts to linear probability.
 */
export function openaiLogprobsToConfidencePercent(
	logprobs: { token: string; logprob: number }[] | null | undefined,
): number | null {
	if (!logprobs?.length) return null;
	const avg = logprobs.reduce((sum, t) => sum + t.logprob, 0) / logprobs.length;
	const linear = Math.exp(avg) * 100;
	if (!Number.isFinite(linear)) return null;
	return Math.min(100, Math.max(0, linear));
}
