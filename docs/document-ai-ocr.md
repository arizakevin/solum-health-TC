# Document AI OCR (Google Cloud)

Optional integration for **server-side OCR** on scanned PDFs and images. The app can continue to use **Gemini vision** and **`pdfjs-dist` text extraction** when these variables are unset; enabling Document AI adds a dedicated OCR path for improved text recovery.

## Architecture

| Approach | Role |
|----------|------|
| **`pdfjs-dist`** | Fast text layer extraction for text-based PDFs (no cloud cost, runs server-side). |
| **Gemini (inline PDF / images)** | Structured extraction, reasoning, and form mapping (sections A-G). Receives both text and binary parts. |
| **Cloud Document AI (Document OCR processor)** | Managed OCR tuned for document layout, handwriting, and text recovery on poor scans. Runs *before* Gemini to produce a clean text channel. |

### How they work together

Document AI and Gemini serve **different roles** in the pipeline:

1. **Document AI** recovers raw text from pixels (OCR). It does not understand the form schema or medical context.
2. **Gemini** receives the OCR text *and* the original file (for layout/visual cues), then maps everything to the structured service request schema with confidence scores.

This separation means Gemini can use a lighter, cheaper model (e.g. Flash-Lite) because it no longer needs to do heavy pixel-level text recovery — Document AI handles that.

### OCR strategy (conditional — Option C)

Not every document needs paid OCR. The pipeline applies Document AI **conditionally**:

| Document type | pdfjs | Document AI OCR | Gemini |
|--------------|-------|-----------------|--------|
| **Digital PDF** (rich text layer) | Extracts text | Skipped (pdfjs text is sufficient) | Receives text + inline PDF |
| **Scanned PDF** (sparse/empty text layer) | Returns little/nothing | Runs OCR, produces text | Receives OCR text + inline PDF |
| **Images** (PNG, JPG, TIFF) | N/A | Always runs OCR | Receives OCR text + inline image |

Users can override this default via per-case extraction settings (enhanced scan reading on/off, force OCR on all documents).

## Pricing

| Service | Cost | Free tier |
|---------|------|-----------|
| **Enterprise Document OCR** | **$1.50 per 1,000 pages** | 1,000 pages/month free |
| OCR add-ons (optional, not used) | $6.00 per 1,000 pages | — |
| Form Parser (not used) | $30.00 per 1,000 pages | — |

For this app, only the **Enterprise Document OCR** processor is needed. At typical case volumes (5-20 pages per case), the free tier covers ~50-200 cases/month before any charges apply.

See current rates: [Google Cloud Document AI pricing](https://cloud.google.com/document-ai/pricing).

## GCP setup (console)

1. Pick a **GCP project** and note the **Project ID** (IAM & Admin > **Settings**, not the display name).
2. Enable **Cloud Document AI API**: APIs & Services > **Enable APIs and services** > search **Cloud Document AI API** > **Enable**.
3. Create a processor:
   - Click the **top search bar** (or press `/`), type **`Document AI`**, open **Document AI** (product page).
   - Go to **Processors** (or **Create processor**).
   - Choose **Document OCR** (sometimes labeled **OCR**).
   - Select the **region** you want (for example **United States** or **European Union**), then create.
   - Open the processor details and copy **Processor ID** and the **location** string the console shows (use that exact value in `GOOGLE_CLOUD_LOCATION`).
4. Create a **service account** (IAM & Admin > **Service accounts** > **Create**), grant **Document AI API User** (`roles/documentai.user`), then **Keys** > **Add key** > **Create new key** > **JSON**. Open the downloaded JSON and copy `client_email` and `private_key` into your `.env` (or Vercel env vars). Delete or secure the JSON file after.

## Configuration

Copy `.env.example` to `.env` or `.env.local` and set:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project id. |
| `GOOGLE_CLOUD_LOCATION` | Same region as the processor (e.g. `us`). |
| `GOOGLE_DOCUMENT_AI_PROCESSOR_ID` | Processor id from the console. |
| `GCP_CLIENT_EMAIL` | `client_email` from the service account JSON. |
| `GCP_PRIVATE_KEY` | `private_key` from the service account JSON (paste as-is including markers). |

Extract `client_email` and `private_key` from your downloaded service account JSON. The app passes them directly to the `@google-cloud/documentai` client via `credentials` — no file path needed, works identically on local dev and Vercel.

Never commit keys: the repo **`.gitignore`** includes **`secrets/`**.

## Authentication

**Why a service account (not an API key):** Document AI requires OAuth2-style credentials. The `@google-cloud/documentai` client authenticates using `client_email` + `private_key` passed via the `credentials` constructor option.

**Why `GOOGLE_CLOUD_LOCATION` must match the processor:** Each processor is created in a **region** (for example `us` or `eu`). API calls must use that same location.

### Credential strategy decision

We use **decomposed env vars** (`GCP_CLIENT_EMAIL` + `GCP_PRIVATE_KEY`) rather than a JSON key file. This avoids the `GOOGLE_APPLICATION_CREDENTIALS` file-path approach, which breaks on serverless platforms (Vercel, Lambda) where gitignored files don't exist on disk.

Alternatives evaluated:

| Approach | Verdict |
|----------|---------|
| **Decomposed env vars** (selected) | Simplest — 2 vars, one code path everywhere, `credentials` accepted natively by all `@google-cloud/*` clients. |
| **Base64-encoded JSON** | Works but unnecessary complexity — decode step, larger env var, harder to rotate. |
| **Workload Identity Federation (OIDC)** | Eliminates long-lived keys entirely. Recommended upgrade for production / HIPAA. Requires GCP Identity Pool setup — overkill for MVP. See [Vercel OIDC for GCP](https://vercel.com/docs/oidc/gcp). |

## Checkboxes, form layouts, and Form Parser

### The problem

Some source documents (e.g. the service request form) contain **checkboxes** (Type of Service Requested, Service Setting) and **structured table rows** (CPT codes, ICD-10 codes). Document OCR extracts raw text but does not understand checkbox state or key-value form structure. Gemini still receives the PDF/image binary and can *see* checkboxes, but visual checkbox detection by an LLM is inherently less reliable than a dedicated form processor (~70-80% vs ~95%+ accuracy on checked/unchecked state).

### Why Document OCR is sufficient for v1

- **Gemini multimodal + OCR text covers most cases.** The model receives both the OCR text channel (for clean label/value reading) and the original file (for visual checkbox and layout cues). Before the two-metric redesign, the app’s **single** aggregate blended per-field labels across *all* form slots; that figure was about **95%** on a clean typed referral letter and **78%** on a clinical note in early testing — not comparable to today’s **logprobs-based extraction confidence** (see [`docs/extraction-confidence.md`](./extraction-confidence.md)). Checkbox misreads were still not the primary source of corrections.
- **Corrections concentrated in coded fields, not checkboxes.** The metrics from pre-OCR testing (8/307 fields corrected, 2.6%) were in D — Service (ICD-10, CPT codes) and E — Clinical (medications, assessments), which are array fields requiring precise code reading, not checkbox state.
- **Cost difference is 20x.** Form Parser costs $30/1K pages vs $1.50/1K for Document OCR. For an MVP, this is not justified unless checkbox accuracy is measurably poor after Document AI OCR is added.

### When to upgrade to Form Parser (follow-up)

If post-implementation testing shows that `serviceType` or `serviceSetting` checkboxes are frequently misread:

1. Create a **Form Parser** processor in Document AI (same GCP project, same region).
2. Add a second processor ID to `.env` (e.g. `GOOGLE_DOCUMENT_AI_FORM_PROCESSOR_ID`).
3. Route **form-type documents** (detected by filename pattern, MIME, or user flag) through Form Parser instead of Document OCR.
4. Form Parser returns explicit **key-value pairs** and **checkbox states** — feed those as structured text to Gemini for higher-accuracy mapping.

This is a targeted enhancement, not a blanket change. Most clinical notes, referral letters, and handwritten documents do not benefit from Form Parser.

## Security

- Treat `GCP_PRIVATE_KEY` like a password: no copies in tickets or chat, no commits.
- For production / HIPAA environments, upgrade to **Workload Identity Federation (OIDC)** to eliminate long-lived keys entirely — see the credential strategy section above.
