# LLM model decisions

## Current assignments

| Task | Default model | Notes |
|------|----------------|-------|
| **Extraction** | `gpt-4o-mini` (OpenAI) | `EXTRACTION_PROVIDER=openai` (default). JSON schema + logprobs on the primary call. |
| **Verifier** (optional second call) | `gpt-4o-mini` | `CONFIDENCE_MODEL_ID`. Only when primary returns no logprob-based score. |
| **Annie (chat)** | `gpt-4o-mini` | `ASSISTANT_MODEL_ID` — OpenAI Chat Completions streaming; same `OPENAI_API_KEY` as extraction. |

Configure: `EXTRACTION_PROVIDER`, `EXTRACTION_OPENAI_MODEL_ID`, `EXTRACTION_GEMINI_MODEL_ID` (only if `gemini`; deprecated alias `EXTRACTION_MODEL_ID`), `EXTRACTION_ANTHROPIC_MODEL_ID` (only if `anthropic`), `CONFIDENCE_MODEL_ID`, `ASSISTANT_MODEL_ID`, plus API keys for the providers you use (`OPENAI_API_KEY` required for default extraction + Annie).

## Production guidance

- **Speed / reliability / cost (default):** keep OpenAI extraction on **`gpt-4o-mini`**. For lower latency on heavy PDFs, try **`gpt-4o`** (`EXTRACTION_OPENAI_MODEL_ID`) and compare on your documents.
- **Optional providers:** `EXTRACTION_PROVIDER=gemini` or `anthropic` only if you explicitly need them; expect verifier use more often for case confidence.

## Architecture summary

Single place for defaults and fallback behavior: **[`docs/extraction-architecture.md`](./extraction-architecture.md)**.

## Decision history (abbreviated)

| Date | Change |
|------|--------|
| 2026-04-12 | Case-level confidence from logprobs; split from form completeness. |
| 2026-04-13 | Default extraction → OpenAI `gpt-4o-mini` (logprobs on primary call when returned). |
| 2026-04-13 | Annie → OpenAI streaming (default `gpt-4o-mini`); Gemini extraction model env renamed to `EXTRACTION_GEMINI_MODEL_ID` (alias `EXTRACTION_MODEL_ID` still read). |

Older Gemini-centric experiments and cost tables are superseded by the OpenAI default; see git history if needed.
