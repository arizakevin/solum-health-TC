# LLM Model Decisions

This document records the models evaluated, pricing, and rationale for each AI task in the application.

## Tasks and model assignments

| Task | Model | Input $/1M tokens | Output $/1M tokens | Rationale |
|------|-------|-------------------|-------------------|-----------|
| **Extraction** (structured form fill) | `gemini-3-flash-preview` | $0.50 | $3.00 | Best balance of extraction quality and cost. With Document AI OCR pre-feeding clean text, the model maps text to form fields. Strong structured output and instruction following. |
| **Confidence scoring** (logprobs fallback) | `gpt-4o-mini` (OpenAI) | ~$0.15 | ~$0.60 | Lightweight re-emission of extracted JSON to get token logprobs when Gemini logprobs are unavailable. < $0.001 per call. |
| **Annie** (AI case assistant chat) | `gemini-3-flash-preview` | $0.50 | $3.00 | Medical nuance (CPT codes, ICD-10, prior auth reasoning), conversational, case-aware context. Strong instruction following and clinical reasoning. |

These are configured via `EXTRACTION_MODEL_ID`, `CONFIDENCE_MODEL_ID`, and `ASSISTANT_MODEL_ID` in `.env`.

## Models evaluated

### Google Gemini family (current provider)

| Model | Input $/1M | Output $/1M | Assessed for | Verdict |
|-------|-----------|------------|-------------|---------|
| **gemini-3-flash-preview** | $0.50 | $3.00 | Extraction, Annie | **Selected for both.** Most powerful Flash model — best multimodal reasoning and structured output quality. Good cost/quality balance. |
| **gemini-3.1-flash-lite-preview** | $0.10 | $0.40 | Extraction | Cheapest option. Good for high-volume simple extraction, but weaker on complex medical forms with ambiguous fields. Viable cost-optimized alternative. |
| **gemini-3.1-pro-preview** | $2.00 | $12.00 | Extraction | Overkill — 4x more expensive on input than Flash with marginal accuracy gain when OCR text is pre-fed. |
| **gemini-2.5-flash** | $0.30 | $2.50 | Extraction, Annie | Viable but superseded by 3.x series. Deprecated path. |
| **gemini-2.0-flash** | ~$0.30 | ~$2.50 | — | Deprecated, shutdown June 1 2026. Do not use. |

### Alternative providers considered

| Provider / Model | Input $/1M | Output $/1M | Assessed for | Verdict |
|-----------------|-----------|------------|-------------|---------|
| **Claude 3.5 Haiku** (Anthropic) | ~$0.25 | ~$1.25 | Extraction | Excellent instruction following and structured output. Requires different SDK (`@anthropic-ai/sdk`). Good fallback/second-opinion candidate if multi-provider is needed later. |
| **GPT-4.1 Mini** (OpenAI) | ~$0.40 | ~$1.60 | Extraction | Strong JSON mode. Different SDK. Slightly more expensive than Flash-Lite for comparable accuracy on well-defined schemas. |
| **DeepSeek V3** | ~$0.07 | ~$0.28 | Extraction | Cheapest option. Open-weight. Data sovereignty concerns for healthcare (PHI). Not recommended without self-hosting. |
| **Claude Sonnet 4.5/4.6** (Anthropic) | Higher | Higher | Annie | Strong reasoning and medical knowledge. Good candidate if Annie needs deeper clinical reasoning beyond Flash capabilities. |

### Multi-provider strategy

1. **Gemini for extraction** — `@google/genai` handles document extraction and chat. Natively accepts PDF bytes + images + text in a single call.
2. **OpenAI for confidence** — `openai` SDK used only as a logprobs fallback when Gemini doesn't provide them. Adds < $0.001 per extraction.
3. **Same GCP billing** — Google Cloud / AI Studio account for Gemini + Document AI.
4. **Graceful degradation** — If `OPENAI_API_KEY` is not set, the pipeline still works; confidence is just `null`.

## Cost comparison per 1,000 pages

Assuming ~258 tokens/page input (typical document), ~2,000 tokens structured JSON output per case:

| Configuration | Input cost | Output cost | OCR cost | Total |
|--------------|-----------|------------|---------|-------|
| **Previous** (Pro, no Document AI) | ~$0.52 | ~$24.00 | $0 | ~$24.52 |
| **Flash + Document AI** (selected) | ~$0.13 | ~$6.00 | $1.50 | ~$7.63 |
| **Flash-Lite + Document AI** (cost-optimized alternative) | ~$0.03 | ~$0.80 | $1.50 | ~$2.33 |
| **Flash, no Document AI** | ~$0.13 | ~$6.00 | $0 | ~$6.13 |

The selected configuration (Flash + Document AI) is **~3x cheaper** than the previous Pro-only setup while achieving comparable accuracy and better OCR on handwritten text.

## Decision history

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-09 | Initial: `gemini-2.0-flash` for both tasks | Default model at project start. |
| 2026-04-11 | Extraction: `gemini-3.1-pro-preview`, Annie: `gemini-3-flash-preview` | Upgraded to latest models for better accuracy. |
| 2026-04-12 | Case-level `extractionConfidence` from `avgLogprobs` | Replaces conflated "avg confidence" with calibrated document-level score; completeness split out — see `docs/extraction-confidence.md`. |
| 2026-04-12 | Added OpenAI `gpt-4o-mini` confidence fallback | Gemini API key route [doesn't reliably support logprobs](https://discuss.ai.google.dev/t/logprobs-is-not-enabled-for-gemini-models/107989). OpenAI provides reliable logprobs for confidence scoring. |
| 2026-04-12 | Extraction: `gemini-3-flash-preview` | Evaluated `gemini-3.1-flash-lite-preview` (cheapest) vs `gemini-3-flash-preview` (best quality). Selected Flash for best extraction quality on complex medical forms at reasonable cost. Flash-Lite remains a viable cost-optimized alternative. |

## Logprobs-based extraction confidence

Extraction confidence uses a two-provider fallback chain:

1. **Gemini logprobs (primary):** `responseLogprobs: true` exposes `candidates[0].avgLogprobs`. Many Gemini models via API key [do not support logprobs](https://discuss.ai.google.dev/t/logprobs-is-not-enabled-for-gemini-models/107989) — this is a known, inconsistent limitation across model versions.
2. **OpenAI logprobs (fallback):** When Gemini logprobs are unavailable, the extracted JSON is sent to GPT-4o-mini with `logprobs: true` for a lightweight re-emission. The mean token logprob gives an equivalent confidence signal at < $0.001 per call.
3. **Null:** If neither provider succeeds, `extractionConfidence` is stored as `null`.

See [`docs/extraction-confidence.md`](./extraction-confidence.md) for the full methodology.

## Upgrade path

- **If Gemini adds reliable logprobs support**: the OpenAI fallback becomes unused automatically (primary path takes precedence).
- **Cost optimization**: switch `EXTRACTION_MODEL_ID` to `gemini-3.1-flash-lite-preview` if extraction quality is sufficient for your document types.
- **If Annie needs deeper reasoning**: consider `gemini-3.1-pro-preview` or evaluate Claude Sonnet via Anthropic SDK.
- **For self-hosted / HIPAA**: evaluate Llama 4 or Qwen3 on dedicated infrastructure.
