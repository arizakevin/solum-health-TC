# Solum Health — AI Service Request Processor

An AI-powered healthcare document extraction system that automates service request form completion using **OpenAI** by default for extraction, case confidence, and the in-app assistant (Annie), with optional alternate extraction providers and human-in-the-loop review.

## Documentation

All long-form docs live under **[`docs/`](docs/)**. Start from the hub index **[`docs/README.md`](docs/README.md)** for a categorized map (architecture, AI pipeline, OCR, challenge notes, wireframes, dev log, Cursor/agent material).

**Quick links:** [Implementation plan](docs/implementation-plan.md) · [Wireframes](docs/wireframes/README.md) · [Document AI OCR](docs/document-ai-ocr.md) · [Extraction architecture](docs/extraction-architecture.md) · [LLM model decisions](docs/llm-model-decisions.md) · [Extraction confidence](docs/extraction-confidence.md) · [Dev log](docs/DEVLOG.md) · [AI tooling](docs/ai-tooling.md) · [Agent rules & skills](docs/agent/README.md)

## Live Demo

- **Vercel**: [solum-health-tc.vercel.app](https://solum-health-tc.vercel.app)
- **Loom Walkthrough**: [Watch Video](https://www.loom.com/share/9911c3e8e8674c79804dad7e5ad30bb2)
- **Trello Board**: [Technical Challenge — Solum Health](https://trello.com/invite/b/69d978996fb55e181132780b/ATTIed3ccf2d39b44f624b89ab0eade3690332F5709B/technical-challenge-solum-health)

<div>
  <a href="https://www.loom.com/share/9911c3e8e8674c79804dad7e5ad30bb2">
    <p>Solum Health Technical Challenge Live Demo 🚀 - Watch Video</p>
  </a>
  <a href="https://www.loom.com/share/9911c3e8e8674c79804dad7e5ad30bb2">
    <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/9911c3e8e8674c79804dad7e5ad30bb2-1c794c8f25d535e7-full-play.gif#t=0.1" alt="Loom Thumbnail">
  </a>
</div>

## Features

### Document Upload & Processing
- Drag-and-drop file upload (PDF, PNG, JPG, TIFF)
- Supabase Storage integration with per-user/case paths
- PDF text extraction via `pdfjs-dist` as OCR fallback

### AI-Powered Extraction
- **Default:** OpenAI extraction (`gpt-4o-mini`) — structured JSON and case-level confidence from **logprobs in one call** when returned; optional verifier if not. See [`docs/extraction-architecture.md`](docs/extraction-architecture.md).
- Sections A–G; per-field **high / medium / low** labels; case **confidence** vs **completeness** — [`docs/extraction-confidence.md`](docs/extraction-confidence.md)
- Optional **`EXTRACTION_PROVIDER`** overrides (Gemini / Anthropic) for non-default deployments
- Multi-document cross-referencing for higher accuracy

### Human-in-the-Loop Review
- Inline editable form fields with click-to-edit interaction
- Confidence dot indicators with tooltips showing source
- Missing field badges for empty extractions
- Accordion-based section navigation
- **Correction tracking**: automatically flags which fields were manually corrected

### PDF Generation & Preview
- Server-side PDF rendering via `@react-pdf/renderer`
- Inline preview with download and print actions
- Regeneration support

### Annie — AI Case Assistant
- OpenAI streaming chat (default `gpt-4o-mini`; override with `ASSISTANT_MODEL_ID`)
- Healthcare domain knowledge (CPT codes, ICD-10, prior auth)
- **Case-aware context**: loads current case data when chatting from a case page
- Floating drawer UI with message history

### Correction Metrics Dashboard
- Aggregate statistics: total cases, avg extraction confidence, avg form completeness, correction rate
- Per-section correction breakdown with progress bars
- Recent corrections table

### Authentication & Security
- Supabase Auth (email/password)
- Middleware-based route protection
- Row-Level Security (RLS) on all tables
- Per-user data isolation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui (Radix + CVA) |
| State | Zustand v5 with persist middleware |
| Auth | Supabase Auth (email/password) |
| Database | Supabase Postgres + Prisma 7 ORM |
| Storage | Supabase Storage |
| AI | OpenAI (default extraction, confidence, Annie); optional Gemini/Anthropic extraction — [`docs/extraction-architecture.md`](docs/extraction-architecture.md) |
| PDF | `@react-pdf/renderer` (server-side) |
| OCR | `pdfjs-dist` (text extraction); optional **Cloud Document AI** — see [`docs/document-ai-ocr.md`](docs/document-ai-ocr.md) |
| Linting | Biome 2.4, Husky, lint-staged |
| CI | GitHub Actions (Biome + TypeScript check) |

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated routes
│   │   ├── page.tsx            # Dashboard — case list
│   │   ├── upload/page.tsx     # Upload dropzone
│   │   ├── case/[id]/          # Case review
│   │   │   ├── page.tsx        # Split-pane: docs + form
│   │   │   ├── case-review-client.tsx
│   │   │   └── pdf/page.tsx    # PDF preview
│   │   └── metrics/page.tsx    # Correction metrics
│   ├── sign-in/page.tsx        # Auth page
│   ├── auth/callback/route.ts  # OAuth callback
│   ├── api/
│   │   ├── extract/route.ts    # Case extraction (server)
│   │   ├── generate-pdf/route.ts
│   │   └── assistant/route.ts  # Annie streaming chat
│   └── layout.tsx              # Root layout
├── components/
│   ├── app-nav.tsx
│   ├── annie-chat-drawer.tsx
│   ├── case-list-table.tsx
│   ├── form-field.tsx          # Editable field with confidence
│   ├── form-section.tsx
│   ├── metrics-dashboard.tsx
│   ├── service-request-form.tsx
│   ├── source-documents-panel.tsx
│   └── ui/                     # shadcn components
├── hooks/
│   └── use-annie-chat.ts
├── lib/
│   ├── ai/                     # Gemini client, prompts, schema
│   ├── pdf/                    # PDF template
│   ├── supabase/               # Client, server, middleware
│   ├── types/service-request.ts
│   ├── brand.ts
│   ├── prisma.ts
│   └── utils.ts
├── stores/ui-store.ts
└── middleware.ts
prisma.config.ts                # Prisma 7 config (datasource URL)
prisma/
└── schema.prisma               # Data model (ERD)
```

## Getting Started

### Prerequisites
- Node.js 22+
- Supabase project (Auth + Postgres + Storage)
- Google AI Studio API key (Gemini)
- Optional: Google Cloud **Document AI** (processor + service account JSON) for dedicated OCR — see [`docs/document-ai-ocr.md`](docs/document-ai-ocr.md)

### Setup

```bash
# Clone and install
git clone https://github.com/arizakevin/solum-health-TC.git
cd solum-health-TC
npm install

# Configure environment
cp .env.example .env.local
# Fill in your Supabase and Gemini credentials
# Optional: mkdir -p secrets && place your Document AI service account JSON there (see docs/document-ai-ocr.md)

# Apply database migrations (preferred) or push schema in dev
npx prisma migrate deploy
# Dev-only alternative: npx prisma db push

# After schema changes that add case-level metrics, re-run extraction for existing cases (optional)
# npm run reextract:all -- --yes

# Run development server
npm run dev
```

### Supabase Setup
1. Create a new Supabase project
2. Enable Email auth provider
3. Create a `documents` storage bucket (public: false)
4. Copy the project URL and anon key to `.env.local`

### Environment Variables

**Required** — the app will not start or function without these:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `DATABASE_URL` | Supabase Postgres connection string (use the pooled URL from Dashboard > Settings > Database) |
| `OPENAI_API_KEY` | OpenAI API key — default **extraction** (structured JSON + logprobs), optional confidence verifier, and **Annie** streaming chat |

**Optional** — tuning and non-default providers:

| Variable | Description |
|----------|-------------|
| `EXTRACTION_PROVIDER` | Default `openai`. Set `gemini` or `anthropic` only if you switch extraction backend — see [`docs/extraction-architecture.md`](docs/extraction-architecture.md) |
| `GEMINI_API_KEY` | Required only when `EXTRACTION_PROVIDER=gemini` |
| `ANTHROPIC_API_KEY` | Required only when `EXTRACTION_PROVIDER=anthropic` |
| `CONFIDENCE_MODEL_ID` | OpenAI model for verifier pass when primary logprobs are missing (default `gpt-4o-mini`) |
| `EXTRACTION_OPENAI_MODEL_ID` | OpenAI extraction model (default `gpt-4o-mini`) |
| `ASSISTANT_MODEL_ID` | OpenAI model id for Annie (default `gpt-4o-mini`) |
| `EXTRACTION_GEMINI_MODEL_ID` | Gemini extraction model when using `EXTRACTION_PROVIDER=gemini` (deprecated alias: `EXTRACTION_MODEL_ID`) |
| `EXTRACTION_ANTHROPIC_MODEL_ID` | Anthropic extraction model when using `EXTRACTION_PROVIDER=anthropic` |

**Optional — Document AI OCR** — dedicated OCR for scanned/handwritten PDFs; without it, `pdfjs-dist` text still feeds the extraction model. See [`docs/document-ai-ocr.md`](docs/document-ai-ocr.md):

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project id |
| `GOOGLE_CLOUD_LOCATION` | Processor region (e.g. `us`) |
| `GOOGLE_DOCUMENT_AI_PROCESSOR_ID` | Document AI Document OCR processor id |
| `GCP_CLIENT_EMAIL` | `client_email` from your service account JSON |
| `GCP_PRIVATE_KEY` | `private_key` from your service account JSON (paste as-is, including markers) |

## Design Decisions

1. **Structured extraction on the default path**: OpenAI Chat Completions with `response_format` JSON schema (non-strict) plus Zod validation; optional Gemini/Anthropic paths keep equivalent validation.

2. **Correction tracking at field level**: Each `ExtractionField` record stores both `autoValue` (original AI extraction) and `finalValue` (after human review), with a `wasCorrected` flag. This enables per-field and per-section accuracy metrics.

3. **Three-layer OCR + extraction pipeline**: `pdfjs-dist` handles text-layer PDFs locally; **Cloud Document AI** adds OCR for scans and handwriting; the configured **LLM** receives text plus multimodal parts for form mapping — see [`docs/document-ai-ocr.md`](docs/document-ai-ocr.md).

4. **Right-sized models**: Default **`gpt-4o-mini`** for extraction, verifier (when needed), and Annie; **`gpt-4o`** is a documented upgrade for heavier PDFs or richer chat — see [`docs/llm-model-decisions.md`](docs/llm-model-decisions.md).

5. **Case-level confidence**: On the OpenAI default path, logprobs from the primary completion drive **`extractionConfidence`** when present; otherwise a small OpenAI verifier pass fills the score — see [`docs/extraction-confidence.md`](docs/extraction-confidence.md).

6. **Server-side PDF generation**: Using `@react-pdf/renderer` on the server avoids client-side bundle bloat and enables consistent rendering.

7. **SSE streaming for Annie**: Server-Sent Events provide real-time token streaming for the chat assistant without WebSocket complexity.

8. **Two extraction metrics at case level**: Logprobs-derived **extraction confidence** measures model certainty for the emitted JSON; **form completeness** measures how many schema fields have values. Averaging per-field labels across empty slots previously mixed “missing in source” with “uncertain read” — see [`docs/extraction-confidence.md`](docs/extraction-confidence.md).

## If I Had More Time

- **Richer Document AI** (custom processors, forms parsers) beyond baseline Document OCR
- **Realtime voice chat** using OpenAI Realtime API with WebRTC
- **Batch processing** for multi-case uploads
- **Unit tests** (Vitest) and **E2E tests** (Playwright)
- **HIPAA hardening**: audit logs, encryption at rest, BAA
- **i18n** support for multi-language documents
