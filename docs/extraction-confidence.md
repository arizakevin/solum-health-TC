# Extraction confidence and form completeness

This page defines the two aggregate signals shown after extraction and on the metrics dashboard. They answer different questions and must not be mixed.

## Extraction confidence (document-level)

**Question:** How probable was the model's structured JSON output, token by token?

The pipeline attempts logprobs from two providers in a fallback chain:

1. **Gemini (primary):** Calls `generateContent` with `responseLogprobs: true` and reads `candidates[0].avgLogprobs`. If the model supports it, this is a length-normalized average log probability of the generated tokens.
2. **OpenAI (fallback):** If Gemini logprobs are unavailable (model doesn't support them, API error), the extracted JSON is sent to GPT-4o-mini with `logprobs: true`. The mean of the per-token logprobs from the re-emission gives an equivalent confidence signal. Cost is negligible (< $0.001 per call).
3. **Null:** If neither provider returns logprobs (e.g. no `OPENAI_API_KEY` configured), the field is stored as `null` and the UI prompts a re-extraction.

Both providers use the same formula to convert to a **0–100 percentage** stored on the case as `extractionConfidence`:

$$
\text{percent} = \min(100,\, \max(0,\, e^{\text{avgLogprobs}} \times 100))
$$

This metric reflects **extraction quality for the response the model actually produced**, not "how much of the form was filled."

### Known provider limitations

- **Gemini API key route:** Many Gemini models (including preview variants) return `Logprobs is not enabled for this model`. This is a [known, inconsistent limitation](https://discuss.ai.google.dev/t/logprobs-is-not-enabled-for-gemini-models/107989) — support has been toggled on/off across versions and the community has documented widespread issues. Vertex AI may work where the API key doesn't. The OpenAI fallback addresses this.
- **OpenAI:** GPT-4o-mini, GPT-4o, and GPT-5.x all support logprobs reliably. Reasoning models (o-series) do not.

## Form completeness (coverage)

**Question:** What fraction of form fields have a non-empty value (after extraction or human edits)?

For each case:

Completeness = (number of fields where `(finalValue ?? autoValue).trim()` is non-empty) / (total extraction fields for the case).

Sparse sources (e.g. insurance cards, short clinical notes) legitimately yield **low completeness** while **extraction confidence** can still be high if the model's JSON was confident.

## Per-field `high` / `medium` / `low`

The schema still requires a discrete **confidence label** per field for UX (color-coded dots and tooltips). Those labels are **LLM self-reports** and are not calibrated probabilities; research shows they can diverge from actual error rates.

We **keep** them for the case review UI. The **aggregate "extraction %"** uses logprobs instead of averaging those labels across all fields (especially empty ones), which previously **conflated** "missing in source" with "low extraction quality."

## Day 3 discovery (April 12, 2026)

Document AI OCR regression testing showed aggregate "confidence" barely moving on handwritten notes. Investigation showed the old metric averaged label weights over **every** field, so empty fields (not in the document) dragged the score down the same way as uncertain extractions—unrelated to OCR improvements.

Splitting **extraction confidence** (logprobs) from **form completeness** (filled/total) fixes that interpretation bug. See [`docs/DEVLOG.md`](./DEVLOG.md) Day 3.

## Related docs

- [`docs/document-ai-ocr.md`](./document-ai-ocr.md) — OCR path vs Gemini mapping  
- [`docs/llm-model-decisions.md`](./llm-model-decisions.md) — models and logprobs usage  
