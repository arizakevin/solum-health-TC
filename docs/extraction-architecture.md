# Extraction — architecture and defaults

## Conclusion (after evaluation)

**Use OpenAI for extraction with the default settings.** One Chat Completions request returns structured JSON **and**, in normal operation, **token logprobs** mapped to case-level **`extractionConfidence`** — no second model round trip when logprobs are present.

A **second** OpenAI call (`CONFIDENCE_MODEL_ID`, default `gpt-4o-mini`) runs only if the primary response has **no** usable logprob score (uncommon for `gpt-4o-mini` / `gpt-4o` in practice). It can run **inline** (`EXTRACTION_SYNC_OPENAI_CONFIDENCE=true`) or **after** extraction completes (default: client `finalizeExtractionConfidence`).

Other providers (`EXTRACTION_PROVIDER=gemini` or `anthropic`) remain in code for flexibility; they typically need the verifier for case confidence. Prefer **not** changing provider unless you have a specific requirement.

## Defaults

| Setting | Default |
|---------|---------|
| `EXTRACTION_PROVIDER` | `openai` |
| `EXTRACTION_OPENAI_MODEL_ID` | `gpt-4o-mini` |
| `CONFIDENCE_MODEL_ID` | `gpt-4o-mini` |
| `ASSISTANT_MODEL_ID` (Annie only) | `gpt-4o-mini` (OpenAI chat model id) |
| `EXTRACTION_GEMINI_MODEL_ID` (Gemini extraction only) | `gemini-3-flash-preview` |

Gemini / Anthropic extraction envs apply only when that provider is selected. Deprecated alias for the Gemini model env: `EXTRACTION_MODEL_ID` (still read if set).

## Where things live in code

Orchestration: `src/lib/extraction/run-case-extraction.ts`. Document → multimodal parts: `build-extraction-parts.ts`. OpenAI extraction: `openai-structured-extraction.ts`. Optional Gemini / Anthropic modules alongside small format adapters.

Benchmark env vars: file header in `scripts/benchmark-extraction-models.ts`.

## See also

- [`docs/extraction-confidence.md`](./extraction-confidence.md) — formula, completeness vs confidence, UI  
- [`docs/llm-model-decisions.md`](./llm-model-decisions.md) — brief task table and env list  
