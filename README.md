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
- Per-field **confidence scoring** (high / medium / low) with visual indicators
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
- Aggregate statistics: total cases, avg confidence, correction rate
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
| AI | Google Gemini (`@google/genai` SDK) |
| PDF | `@react-pdf/renderer` (server-side) |
| OCR | `pdfjs-dist` (text extraction) |
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
prisma/
├── schema.prisma               # Data model (ERD)
└── prisma.config.ts            # Prisma 7 config
```

## Getting Started

### Prerequisites
- Node.js 22+
- Supabase project (Auth + Postgres + Storage)
- Google AI Studio API key (Gemini)

### Setup

```bash
# Clone and install
git clone https://github.com/arizakevin/solum-health-TC.git
cd solum-health-TC
npm install

# Configure environment
cp .env.example .env.local
# Fill in your Supabase and Gemini credentials

# Push database schema
npx prisma db push

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
| `EXTRACTION_MODEL_ID` | Model for extraction (default: `gemini-2.0-flash`) |
| `ASSISTANT_MODEL_ID` | Model for Annie (default: `gemini-2.0-flash`) |
| `NEXT_PUBLIC_SITE_URL` | Application URL for OAuth callbacks |

## Design Decisions

1. **Gemini structured output over prompt-and-parse**: Using `responseMimeType: "application/json"` with `responseSchema` guarantees valid JSON matching our Zod schema, eliminating parsing failures.

2. **Correction tracking at field level**: Each `ExtractionField` record stores both `autoValue` (original AI extraction) and `finalValue` (after human review), with a `wasCorrected` flag. This enables per-field and per-section accuracy metrics.

3. **PDF text extraction + vision**: For PDFs, we extract text via `pdfjs-dist` AND send the raw PDF to Gemini as inline data. This dual approach handles both text-based and scanned PDFs.

4. **Server-side PDF generation**: Using `@react-pdf/renderer` on the server avoids client-side bundle bloat and enables consistent rendering.

5. **SSE streaming for Annie**: Server-Sent Events provide real-time token streaming for the chat assistant without WebSocket complexity.

## If I Had More Time

- **GCP Document AI** for production-grade OCR on scanned documents
- **Realtime voice chat** using OpenAI Realtime API with WebRTC
- **Batch processing** for multi-case uploads
- **Row-Level Security** policies in Supabase for defense-in-depth
- **Unit tests** (Vitest) and **E2E tests** (Playwright)
- **HIPAA hardening**: audit logs, encryption at rest, BAA
- **i18n** support for multi-language documents
