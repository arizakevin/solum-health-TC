# Solum Health — AI Service Request Processor

An AI-powered healthcare document extraction system that automates service request form completion using Google Gemini, with human-in-the-loop review and correction tracking.

## Live Demo

- **Vercel**: _[Deploy URL — to be added after deployment]_
- **Loom Walkthrough**: _[Recording URL — to be added]_
- **Trello Board**: _[Board URL — to be added]_

## Features

### Document Upload & Processing
- Drag-and-drop file upload (PDF, PNG, JPG, TIFF)
- Supabase Storage integration with per-user/case paths
- PDF text extraction via `pdfjs-dist` as OCR fallback

### AI-Powered Extraction
- **Gemini structured output** with JSON schema enforcement
- Extracts all fields for service request form sections A–G
- Per-field **confidence labels** (high / medium / low) with visual indicators
- **Case-level extraction confidence** from token log-probabilities (`avgLogprobs`), stored separately from **form completeness** (filled ÷ total fields) — see [`docs/extraction-confidence.md`](docs/extraction-confidence.md)
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
- Gemini Flash-powered streaming chat
- Healthcare domain knowledge (CPT codes, ICD-10, prior auth)
- **Case-aware context**: loads current case data when chatting from a case page
- Floating drawer UI with message history

### Correction Metrics Dashboard
- Aggregate statistics: total cases, avg extraction confidence, avg form completeness, correction rate
- Per-section correction breakdown with progress bars
- Recent corrections table

### Authentication & Security
- Supabase Auth (email/password + Google OAuth)
- Middleware-based route protection
- Per-user data isolation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui (Radix + CVA) |
| State | Zustand v5 with persist middleware |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase Postgres + Prisma 7 ORM |
| Storage | Supabase Storage |
| AI | Google Gemini 3.x (`@google/genai` SDK) — see [`docs/llm-model-decisions.md`](docs/llm-model-decisions.md) |
| PDF | `@react-pdf/renderer` (server-side) |
| OCR | `pdfjs-dist` (text extraction); optional **Cloud Document AI** (see `docs/document-ai-ocr.md`) |
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
│   │   ├── extract/route.ts    # Gemini extraction pipeline
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
│   ├── upload-dropzone.tsx
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
2. Enable Email and Google auth providers
3. Create a `documents` storage bucket (public: false)
4. Copy the project URL and anon key to `.env.local`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | Supabase Postgres connection string |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `EXTRACTION_MODEL_ID` | Model for extraction (default: `gemini-3.1-flash-lite-preview`) — see [`docs/llm-model-decisions.md`](docs/llm-model-decisions.md) |
| `ASSISTANT_MODEL_ID` | Model for Annie chat (default: `gemini-3-flash-preview`) — see [`docs/llm-model-decisions.md`](docs/llm-model-decisions.md) |
| `NEXT_PUBLIC_SITE_URL` | Application URL for OAuth callbacks |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project id (Document AI) |
| `GOOGLE_CLOUD_LOCATION` | Processor region (must match processor) |
| `GOOGLE_DOCUMENT_AI_PROCESSOR_ID` | Document AI Document OCR processor id |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON (e.g. `./secrets/key.json`) |

## Design Decisions

1. **Gemini structured output over prompt-and-parse**: Using `responseMimeType: "application/json"` with `responseSchema` guarantees valid JSON matching our Zod schema, eliminating parsing failures.

2. **Correction tracking at field level**: Each `ExtractionField` record stores both `autoValue` (original AI extraction) and `finalValue` (after human review), with a `wasCorrected` flag. This enables per-field and per-section accuracy metrics.

3. **Three-layer OCR + extraction pipeline**: `pdfjs-dist` handles text-layer PDFs locally; **Cloud Document AI** provides dedicated OCR for scanned documents, handwriting, and images; **Gemini** receives the pre-extracted text plus the original file for structured form mapping. This separation lets the extraction model (Flash-Lite) focus on reasoning rather than pixel-level text recovery — see [`docs/document-ai-ocr.md`](docs/document-ai-ocr.md).

4. **Right-sized models per task**: Flash-Lite for extraction (well-defined schema, $0.10/1M input), Flash for Annie chat (medical reasoning, $0.50/1M input). Pro evaluated and rejected as overkill when Document AI handles OCR — see [`docs/llm-model-decisions.md`](docs/llm-model-decisions.md).

5. **Server-side PDF generation**: Using `@react-pdf/renderer` on the server avoids client-side bundle bloat and enables consistent rendering.

6. **SSE streaming for Annie**: Server-Sent Events provide real-time token streaming for the chat assistant without WebSocket complexity.

7. **Two extraction metrics at case level**: Logprobs-derived **extraction confidence** measures model certainty for the emitted JSON; **form completeness** measures how many schema fields have values. Averaging per-field labels across empty slots previously mixed “missing in source” with “uncertain read” — see [`docs/extraction-confidence.md`](docs/extraction-confidence.md).

## If I Had More Time

- **Richer Document AI** (custom processors, forms parsers) beyond baseline Document OCR
- **Realtime voice chat** using OpenAI Realtime API with WebRTC
- **Batch processing** for multi-case uploads
- **Row-Level Security** policies in Supabase for defense-in-depth
- **Unit tests** (Vitest) and **E2E tests** (Playwright)
- **HIPAA hardening**: audit logs, encryption at rest, BAA
- **i18n** support for multi-language documents
