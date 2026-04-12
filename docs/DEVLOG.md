# Dev log

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
| `case-review-handwritten-note.png` | Harder document (handwritten note): lower aggregate confidence and more "missing" section indicators. |
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

## Day 3 — April 12, 2026 (Document AI OCR, confidence architecture, model selection)

**Time spent:** ~6 hours (late night / early morning session)

### Document AI OCR integration

- Wired **Google Cloud Document AI** as a conditional OCR step: extraction settings UI, pipeline hooks, toggle between direct Gemini multimodal vs OCR-first text feed.
- Regression on sample cases (typed referral, clinical notes, insurance card, handwritten note).

### Confidence architecture fix

- **Problem:** Aggregate "avg confidence" barely moved on handwritten OCR runs (67% → 69%). The old metric averaged per-field label weights (`high`/`medium`/`low` → 95/78/45) across **every** field — empty fields from sparse sources dragged the score down identically to uncertain extractions, conflating **completeness** with **quality**.
- **Solution:** Split into two independent metrics:
  - **Extraction confidence** (0–100): derived from model logprobs — how certain the AI was about the values it produced.
  - **Form completeness** (filled/total): how much of the form has values, regardless of extraction quality.
- **Prisma migration:** `cases.extraction_confidence` as nullable `Float`, backfilled on re-extract.
- Per-field `high`/`medium`/`low` labels kept for dots/tooltips; prompt updated so "low" no longer means "not found."

### Logprobs fallback chain

- Gemini API key route [does not reliably support logprobs](https://discuss.ai.google.dev/t/logprobs-is-not-enabled-for-gemini-models/107989) — many models return "Logprobs is not enabled" or omit `avgLogprobs`.
- Implemented a two-provider fallback: **Gemini logprobs → OpenAI `gpt-4o-mini` re-emission → `null`**. The OpenAI pass re-emits extracted JSON with `logprobs: true` and derives the same 0–100 score from mean token logprob (< $0.001 per call).

### Model selection

- Evaluated `gemini-3-flash-preview` ($0.50/$3.00) vs `gemini-3.1-flash-lite-preview` ($0.10/$0.40). Selected **Flash** as default — better structured mapping on complex medical forms. Flash-Lite documented as cost-downgrade option.
- See [`docs/llm-model-decisions.md`](./llm-model-decisions.md) for full evaluation and pricing.

### UI polish

- Source panel: **"N% confidence"** badge with tiered color (green ≥80% / amber ≥50% / red <50%), **"Confidence: pending"** when no score yet, client-facing tooltips.
- Metrics cards: retitled to **Extraction Confidence** and **Form Completeness** with color-coded values and plain-language subtitles.

### Key decisions

- **Two metrics, not one** — OCR improvements lift extraction confidence independently; completeness stays honest for sparse sources.
- **No Vertex dependency for confidence** — OpenAI keys already available; Vertex remains optional if Gemini logprobs stabilize.
- **Flash over Flash-Lite** — quality wins for a challenge demo; Flash-Lite is a documented cost-downgrade path.

### Evidence

| Folder | Contents |
|--------|----------|
| [`day-3-2026-04-12-document-ai-ocr/`](./screenshots/day-3-2026-04-12-document-ai-ocr/) | OCR integration: dashboard, case reviews, metrics, extraction settings. |
| [`day-3-confidence-split/`](./screenshots/day-3-confidence-split/) | Confidence/completeness split: dashboard, metrics, settings, four representative cases. |

### Documentation

- [`docs/extraction-confidence.md`](./extraction-confidence.md) — methodology, formula, provider limitations
- [`docs/llm-model-decisions.md`](./llm-model-decisions.md) — model evaluations, pricing, decision history
- [`docs/document-ai-ocr.md`](./document-ai-ocr.md) — OCR path and configuration

---

### Day 3 afternoon — Deployment verification, README overhaul, credential strategy

**Time spent:** ~2 hours

#### Vercel deployment verification

- Connected to Vercel MCP: confirmed project `solum-health-tc` is live at [solum-health-tc.vercel.app](https://solum-health-tc.vercel.app), latest deployment `READY` (production, Turbopack, Next.js 16.2.3).
- Verified zero runtime errors in the last 6 hours, build logs clean (Prisma 7.7 generates successfully).
- All environment variables confirmed set in Vercel dashboard.

#### README overhaul

- Added live Vercel URL; removed placeholder links.
- Fixed stale references: removed Google OAuth (email/password only), added RLS to security section, removed it from "If I Had More Time."
- Rewrote environment variables into four tiers: **Required** (5 vars), **Recommended** (OpenAI confidence fallback), **Optional model overrides** (with defaults), **Optional Document AI OCR**.
- Updated design decisions: Flash as primary model (not Flash-Lite), new entry for dual-provider confidence scoring with forum thread link, renumbered to 8 decisions.
- Removed unused `NEXT_PUBLIC_SITE_URL` from code, `.env`, and `.env.example` (never referenced).

#### GCP credential strategy (Document AI)

- **Problem:** `GOOGLE_APPLICATION_CREDENTIALS` expects a file path — `secrets/` is gitignored, so the JSON key doesn't exist on Vercel's serverless filesystem. Document AI silently fell back to Gemini-native OCR.
- **Evaluated:** decomposed env vars vs base64-encoded JSON vs Workload Identity Federation (OIDC).
- **Selected:** decomposed `GCP_CLIENT_EMAIL` + `GCP_PRIVATE_KEY` — one code path everywhere (local and Vercel), no file system dependency, natively accepted by all `@google-cloud/*` client constructors. OIDC documented as the recommended upgrade for production/HIPAA.
- Updated `config.ts` and `run-document-ocr.ts` to use `credentials` instead of `keyFilename`.
- Updated `.env.example`, README, and `docs/document-ai-ocr.md` with the new approach and decision rationale.

#### Key decisions

- **One credential mode, not two** — same env vars work on local dev and Vercel; eliminates branching and reduces cognitive overhead.
- **Unused env vars removed** — `NEXT_PUBLIC_SITE_URL` was never referenced in code; `GOOGLE_APPLICATION_CREDENTIALS` replaced by decomposed vars.
