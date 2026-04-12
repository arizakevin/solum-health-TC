# Work Log

## Day 1 — April 10, 2026 (Planning & Architecture)

**Time spent:** ~6 hours

### What I did

- Analyzed the challenge requirements, sample documents (8 PDFs), and the service request form structure (Sections A–G)
- Evaluated tech stack options: Next.js (App Router), Supabase (Auth + Postgres + Storage), Prisma ORM, Gemini AI, shadcn/ui
- Researched and pinned latest stable versions of all dependencies (Next.js 16.2.x, Tailwind 4.2.x, Prisma 7.7.x, pdfjs-dist 5.6.x, etc.)
- Designed the extraction pipeline approach: pdfjs text layer extraction → Gemini 3.1 Pro multimodal → structured JSON output with Zod schemas and per-field confidence scoring
- Created wireframes for all 9 screens and the navigation flow (grayscale, focusing on layout and information hierarchy)
- Set up a Trello board with prioritized task columns: ToDo, Doing, Done, Backlog
- Wrote the full implementation plan: architecture diagram, ERD, phased breakdown (Phases 0–5), risk register, model recommendations, and Git strategy
- Prepared the agentic AI development workflow (Cursor rules, phased plan for AI-assisted implementation with human-in-the-loop review)
- Evaluated and deferred non-core features (realtime voice chat, OCR hardening, batch processing, unit/E2E tests) to the backlog — prioritizing AI coding token budget for core features within the challenge timeframe
- Initial commit: planning artifacts, wireframes, sample documents, and assistant avatar asset

### Key decisions

- **Gemini as primary AI provider**: Best multimodal extraction quality for documents, native structured JSON output, single provider simplicity with `@google/genai` SDK
- **shadcn/ui for UI primitives**: Well-documented Radix + CVA pattern, fast to scaffold, consistent design system
- **Prisma ORM for Supabase Postgres**: Type-safe queries, clean schema-as-code, easy migrations
- **Plan-first approach**: Full architecture, wireframes, and phased implementation plan before writing any application code
- **Phased delivery**: Phase 0 (docs) → Phase 1 (scaffold) → Phase 2 (extraction MVP, the core deliverable) → Phase 3 (auth) → Phase 4 (Annie assistant) → Phase 5 (stretch)
- **Confidence scoring as first-class**: Every extracted field carries high/medium/low confidence, displayed as color-coded indicators, tracked as correction metrics
- **Tests deferred to backlog**: Unit tests (Vitest) and E2E tests (Playwright) moved to backlog to preserve AI coding tokens for actual feature implementation within the challenge timeframe

## Day 2 — April 11, 2026 (MVP complete; polish & stretch backlog)

**Time spent:** ~5 hours (execution, debugging, review, and refactors)

### Status: MVP matches "working product" criteria

The **core challenge loop** works end-to-end in the real app: sign-in, cases, uploads to Supabase Storage, **server-side** extraction (pdfjs + Gemini structured output), case review with **per-field confidence**, human edits with correction tracking, metrics, PDF generation/preview, and **Annie** (streaming, case-aware). Model calls and API keys stay **on the server** (Next.js Route Handlers / server actions), not on end-user/clinic browsers.

Sample clinical PDFs for quality evaluation live under `sample-documents/`, including `01-clinical-progress-note.pdf` through `06-handwritten-clinical-note.pdf` (with `07-*` reserved for the blank/filled service request form templates).

### MVP QA — documented test (basic working product)

Screenshots below serve as **documented evidence** of the app's working state after the MVP was declared complete on Day 2. The app was tested manually throughout development; this pass captures the state of the **live app** (dashboard, case review, metrics) with **already persisted** cases and extractions for the record. Viewport captures at **1920×1080** so the two-column case review layout and metrics tables are readable.

**Evidence folder:** [`docs/screenshots/day-2-2026-04-11-mvp-basic-working-product/`](./screenshots/day-2-2026-04-11-mvp-basic-working-product/)

| Screenshot | What it verifies |
|------------|-------------------|
| `dashboard-extraction-cases.png` | Case list, statuses, document counts, and review/delete affordances on the dashboard. |
| `metrics-page.png` | Aggregate metrics (cases, avg confidence, corrections) and recent-corrections visibility. |
| `case-review-referral-letter.png` | High-confidence sample (referral letter): sources panel, aggregate confidence, form sections at a glance. |
| `case-review-form-sections.png` | Same case with a section expanded: per-field confidence dots and section completion hints. |
| `case-review-handwritten-note.png` | Harder document (handwritten note): lower aggregate confidence and more “missing” section indicators. |
| `case-review-expanded-form.png` | Clinical progress note: mid-range aggregate confidence with collapsed sections. |
| `case-review-form-fields-confidence.png` | Same case, member section expanded: mix of high-confidence filled fields and explicit **Missing** placeholders. |

### What shipped (summary)

- Extraction reliability: shared extraction path; fixed unauthenticated internal `fetch` / HTML-as-JSON failure class.
- Dev/deploy hygiene: stable local dev (`next dev --webpack`); session refresh via Next **proxy** (`proxy.ts`).
- Case lifecycle: delete / bulk delete; source documents UX; auto-extract after upload where applicable.
- UX: Annie drawer layout and scrolling; form section completion hints; PDF page layout; metrics corrections pagination and readable field labels.
- Branding: **AuthScribe by Solum Health** in config, nav, assistant prompt, PDF footer.

### Architecture / deferrals (for README + Loom)

- **Next.js** orchestrates AI + Prisma; **Supabase** provides Auth, Postgres, and Storage — one TypeScript surface, fewer deployables than adding FastAPI/Railway for this scope.
- **FastAPI on Railway** stays a documented optional path (e.g. heavy OCR) deferred in favor of timeline, UX for review/correction, and extraction quality work ("scrappiness" over extra infrastructure).

### Extraction quality: confidence results across sample documents

_Results from running each sample PDF (01–06) through the production extraction pipeline in the live app. Aggregate confidence is computed per case from per-field confidence labels (high = 95%, medium = 78%, low = 45%). UI evidence for a subset of these runs is in the [Day 2 MVP QA folder](./screenshots/day-2-2026-04-11-mvp-basic-working-product/) above._

| Document | Confidence | Fields | High | Med | Low | Notes |
|----------|-----------|--------|------|-----|-----|-------|
| 01 – Clinical Progress Note | 78% | 45 | 27 | 4 | 14 | Structured clinical note |
| 02 – Referral Letter | 95% | 47 | 46 | 1 | 0 | Clean digital PDF; near-perfect |
| 03 – Insurance Card | 58% | 36 | 9 | 0 | 27 | Card format; many fields not applicable |
| 04 – Lab Results | 79% | 49 | 31 | 3 | 15 | Results tables; good extraction |
| 05 – Patient Intake Form | 82% | 44 | 32 | 1 | 11 | Multi-section form |
| 06 – Handwritten Clinical Note | 69% | 41 | 17 | 4 | 20 | OCR difficulty test; handwriting |
| **Overall average** | **77%** | **262 total** | **162** | **13** | **87** | — |

### Post-MVP backlog (from notes — polish and stretch)

- **Mobile responsiveness** across dashboard, case review, metrics, and chat.
- **Annie — full app actions**: implement server-validated tooling so the assistant can perform the same operations a user can (forms, navigation, extraction, deletes, etc.); consider a **more capable Gemini model** for that mode because tool-use and multi-step reasoning are harder than read-only Q&A.
- **Annie settings** in-panel: which categories of actions are allowed (sensible defaults: on).
- **Guided in-app tutorial** (first-run or "Help" tour): short, contextual steps through upload → extract → review → save/PDF → metrics — improves discoverability for reviewers (implementation TBD).
- **Dashboard filters** (reuse ideas for richer search/filter later).
- **Extraction / OCR quality gate**: structured evaluation on sample PDFs `01`–`06` (evidence via real UI runs; screenshots under `docs/screenshots/day-2-2026-04-11-mvp-basic-working-product/` for the first MVP QA pass — numbers from the app's aggregate confidence logic after extraction).
- **Docs**: optional in-app or linked docs site.
- **Tests**: Vitest + Playwright; reuse a dedicated test account only in CI secrets / local `.env` — never commit passwords.
- **i18n** (EN/ES), **marketing landing**, optional **MVP-frozen branch + second deploy**, **slide deck** for a tight Loom.
- **Knowledge graph / data visualization** for searching, filtering, and visualizing patient data by cases, insurance state, authorization state, etc.

### Key decisions (Day 2)

- **Defer FastAPI/Railway** for this MVP; ship and document instead of fragmenting the stack.
- **Quality evidence**: prefer manual or E2E flows through the deployed/local UI so metrics match production code paths.
- **Product naming**: AuthScribe by Solum Health — AI-powered prior authorization scribe.

## Day 3 — April 12, 2026 (Document AI OCR + confidence architecture fix)

**Time spent:** ~4 hours (integration, regression passes, metric redesign, documentation)

### What I did

- Finished **Google Cloud Document AI** wiring (conditional OCR, extraction settings UI, pipeline hooks) and ran **Day 3 regression** on sample cases (typed referral, clinical notes, insurance card, handwritten note).
- **Discovery:** Aggregate “avg confidence” barely moved on handwritten OCR runs (e.g. 67% vs 69% baseline). Code review showed the metric **averaged** mapped per-field labels (`high` / `medium` / `low` → 95 / 78 / 45) across **every** form field, so **empty fields** (not present in sparse sources) dragged the number down the same way as **uncertain extractions** — conflating **document completeness** with **extraction quality**.
- **Redesign:** Persist **`extractionConfidence`** on `Case` from Gemini **`avgLogprobs`** (`responseLogprobs: true` in `@google/genai`; `Math.exp(avgLogprobs) * 100`, clamped 0–100). UI and metrics now show **extraction confidence** separately from **form completeness** (filled fields ÷ total). Per-field labels kept for dots/tooltips; prompt updated so “low” is not defined as “not found” for quality semantics.
- Documentation: [`docs/extraction-confidence.md`](./extraction-confidence.md), updates to [`docs/document-ai-ocr.md`](./document-ai-ocr.md), [`docs/llm-model-decisions.md`](./llm-model-decisions.md), README; screenshots under [`docs/screenshots/day-3-2026-04-12-document-ai-ocr/`](./screenshots/day-3-2026-04-12-document-ai-ocr/).

### Key decisions (Day 3)

- **No Vertex migration for logprobs** — the AI Studio–oriented SDK already exposes `avgLogprobs` on the candidate.
- **Two metrics, not one** — OCR improvements should lift extraction confidence when the JSON is confident; completeness stays honest for partial sources (cards, short notes).
- **Prisma migration** — `cases.extraction_confidence` nullable `Float` for backfill on next re-extract.

### Evidence

- Day 3 screenshot set: [`docs/screenshots/day-3-2026-04-12-document-ai-ocr/`](./screenshots/day-3-2026-04-12-document-ai-ocr/) (dashboard, case review variants, metrics, extraction settings).
- After deploying this fix, **re-extract** existing cases once so `extractionConfidence` populates; metrics page shows a legacy footnote until at least one case has the new column filled.

### Confidence split UI — screenshot checklist (manual, same workflow as Day 3)

Headless `npm run reextract:all` was only for **terminal-based** backfill (no browser cookies). **Evidence and regression** should still follow the live app: sign in → **Re-extract** each case → capture UI. Use a new folder, e.g. [`docs/screenshots/day-4-2026-04-12-confidence-metrics/`](./screenshots/day-4-2026-04-12-confidence-metrics/), viewport **1920×1080** to match prior passes.

| File (suggested) | What to show |
|------------------|----------------|
| `metrics-page-two-metrics.png` | Metrics: **Avg extraction confidence** + **Avg form completeness** cards (legacy footnote if no logprobs yet). |
| `case-review-referral-letter-footer.png` | Referral case: source panel footer with **N/M fields** + **% extraction** or “re-extract” hint. |
| `case-review-insurance-card-footer.png` | Insurance card case: high completeness mismatch vs extraction (sparse form). |
| `case-review-handwritten-note-footer.png` | Handwritten note: **completeness** lower, extraction line readable. |
| `case-review-clinical-progress-note-footer.png` | Clinical progress note: both badges visible. |
| `dashboard-cases.png` | Optional: dashboard list after re-extract. |

**Note:** Some extraction models on Google AI Studio return “Logprobs is not enabled”; the app then completes extraction with `extractionConfidence` null and the footer shows **“Extraction score: re-extract”** — screenshots are still valid evidence of the two-metric layout.
