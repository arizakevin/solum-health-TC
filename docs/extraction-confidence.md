# Extraction confidence and form completeness

Two different numbers on the case and metrics views:

## Extraction confidence (0–100)

**Meaning:** Calibrated confidence in the **structured JSON** the model produced (token logprobs), not “how full the form is.”

**Default path (`EXTRACTION_PROVIDER=openai`):** The extraction completion includes logprobs; when present, the case score is computed **in the same request** as extraction.

**If there is no score** and `OPENAI_API_KEY` is set, a small **verifier** call (`CONFIDENCE_MODEL_ID`, default `gpt-4o-mini`) re-emits the JSON with logprobs. By default that runs **after** extraction via the client (`finalizeExtractionConfidence`) so the UI can show **Scoring…**; set `EXTRACTION_SYNC_OPENAI_CONFIDENCE=true` to block until the score exists.

**Formula** (logprob average → percent, clamped 0–100):

$$
\text{percent} = \min(100,\, \max(0,\, e^{\text{avgLogprobs}} \times 100))
$$

If no score is ever produced, the UI shows **Confidence: pending**.

## Form completeness

**Meaning:** Share of extraction field rows with a non-empty `(finalValue ?? autoValue)`. Can be low when the source is sparse even if extraction confidence is high.

## Per-field high / medium / low

Discrete labels on each field for UX; they are model self-reports, not the same as the case-level logprob percent.

## Benchmark

`pnpm bench:extraction` — required env and flags: **`scripts/benchmark-extraction-models.ts`** (top of file).
