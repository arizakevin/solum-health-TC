**Role:** You are my technical partner for a take-home interview challenge. Help me **plan in phases**, **decide pragmatic trade-offs**, and **produce actionable work** (architecture decisions, DB design, task breakdown, implementation). Manage **Trello** cards on my existing board autonomously — only escalate to me on priority conflicts, scope ambiguity, or credential issues.

---

## 1. Challenge spec (employer-provided — verbatim summary)

**Company:** Solum Health — Y Combinator (S22) healthcare AI startup. Products: CRM, Intake Automation (AI agent "Annie"), Insurance Verification, Prior Authorization, Insurance Monitoring, Waitlist Management. See [About](https://getsolum.com/about), [Prior Auth](https://getsolum.com/products/prior-authorization), [Intake](https://getsolum.com/products/intake-automation).

**Problem:** Requesting approval for healthcare services requires extracting patient/clinical info from varied documents (referral letters, clinical notes, lab results, insurance cards, intake forms) and manually entering it into standardized request forms. Documents range from clean digital PDFs to scanned faxes and handwritten notes. It's slow, error-prone, and doesn't scale.

**Build a web application that:**

1. **Extracts structured data from uploaded documents.** Accept PDFs, images, scanned forms. Use OCR and/or AI to extract: patient name/DOB/gender/contact, insurance company/member ID/group number, provider name/NPI/facility, ICD-10 diagnosis codes + descriptions, CPT/procedure codes, medications, assessment scores, clinical history.
2. **Auto-fills a service request form.** Populate a "Request for Approval of Services" form (template provided). User reviews, corrects, approves before saving.
3. **Handles confidence and ambiguity.** Flag uncertain/missing fields. Make auto-filled vs manual-input obvious.
4. **Tracks accuracy.** Simple view showing how often users correct auto-filled fields to measure extraction quality over time.

**Sample documents** (in `solum-health-TC/sample-documents/`):

- `01-clinical-progress-note.pdf` — Structured clinical note with patient info, diagnoses, medications, CPT codes
- `02-referral-letter.pdf` — PCP referral with referring/receiving provider, insurance, clinical history
- `03-insurance-card.pdf` — Front/back with patient demographics
- `04-lab-results.pdf` — Results tables, ordering physician, diagnosis findings
- `05-patient-intake-form.pdf` — Multi-section: insurance, symptoms checklist, medical history, diagnoses
- `06-handwritten-clinical-note.pdf` — Simulated handwritten/scanned (OCR difficulty test)
- `07-service-request-form.pdf` — Blank target form the app should auto-fill
- `07-service-request-form-FILLED-EXAMPLE.pdf` — Reference of what a completed form looks like

**Annie avatar (assistant UI):** Source asset `annie-avatar.webp` at the **repo root** (`solum-health-TC/annie-avatar.webp`) — copy into `public/annie-avatar.webp` and wire the assistant UI to use this photo (not an abstract avatar).

**Evaluation criteria (quoted priorities):**

- **AI tool usage** — leverage OCR, LLMs, code generation tools aggressively. Show the toolkit.
- **Scrappiness** — working product over over-engineered perfection. Speed and pragmatism > polish.
- **Data extraction quality** — handle different document formats and quality levels.
- **UX for review/correction** — human-in-the-loop is critical.
- **Technical decisions** — be ready to explain trade-offs.

**Employer stack:** Next.js, Prisma, Supabase, Vercel, FastAPI, Railway. "Use what makes sense, but if you deviate, be ready to explain why."

**Deliverables:** GitHub repo, live link (Vercel/Railway), Loom recording (process, AI tools, demo, decisions, improvements), brief README (approach, AI tools, architecture).

---

## 2. Repo & assets

- **Repo:** `~/Development/solum-health-TC` — GitHub remote: `https://github.com/arizakevin/solum-health-TC.git`
- **`sample-documents/`** — eight challenge PDFs for extraction testing.
- **`annie-avatar.webp`** (repo root) — Annie assistant photo; copy into `public/` when the app scaffold exists.
- **`docs/wireframes/`** — pre-implementation wireframes for all pages and flows.
- **`git init` + remote + `.gitignore`** — after plan approval; follow **§6 Git & history** for phase-visible history.

---

## 3. Target stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | **Next.js** (latest stable App Router) | Employer stack |
| **Styling** | **Tailwind CSS v4** + Solum-branded CSS variables + shadcn/ui primitives | Standard, well-documented, fast to build with |
| **Typography** | Match [getsolum.com](https://getsolum.com) as closely as practical: inspect computed styles (DevTools). Implement via `next/font` + Tailwind theme. If the exact font is paid, document the closest open alternative in README. |
| **State** | **Zustand** + `persist` → localStorage | Lightweight UI state (sidebar, drawer, preferences) |
| **Backend / Auth** | **Supabase** (Auth + Postgres + Storage) | Employer stack |
| **ORM** | **Prisma** | Type-safe Postgres access; employer stack |
| **DB design** | **Mermaid ERD first** | Visualize before coding |
| **PDF** | **[htmldocs](https://htmldocs.com/)** — fallback: `@react-pdf/renderer` if blocked | Service request → PDF |
| **OCR / extraction** | **Phased** — §4 | MVP first, harden if needed |
| **AI provider** | **Google Gemini** via `@google/genai` | Latest multimodal models; structured JSON output with Zod; single focused integration |
| **AI assistant "Annie"** | Bespoke chat drawer with **real avatar** (`annie-avatar.webp`), Gemini Flash streaming | Context-aware: current case extraction + form state |
| **Deployment** | **Vercel** (Next.js); **Railway** for optional FastAPI Phase B | Employer-aligned |
| **TypeScript** | **Strict** everywhere | No JavaScript files |
| **Lint / format** | **Biome** (+ `.editorconfig`) | Fast, single tool for lint + format |
| **Git hooks** | **Husky** + lint-staged → Biome on staged files | Enforce quality on every commit |
| **CI** | **GitHub Actions** — Biome lint + type-check on push/PR | Visible engineering discipline |
| **Tests** | **Vitest** (unit) + **Playwright** (E2E critical path) | Upload → extract → edit → export |

---

## 4. OCR & extraction strategy (phased)

### Phase A — MVP (fastest end-to-end path)

**Pipeline:** Upload PDF → text layer (`pdfjs-dist`) → if thin/empty, **page images → Gemini 3.1 Pro multimodal** → strict JSON schema for the service-request form → UI.

**Trade-offs:** LLM cost, latency, handwriting limits — acceptable for MVP.

### Extraction Quality Gate (during Phase 1b)

- Run extraction on **all 8 sample PDFs** as soon as the pipeline works.
- Evaluate results, especially `06-handwritten-clinical-note.pdf` (the OCR difficulty test).
- If Gemini handles all docs acceptably: no Phase B needed, document results in README.
- If handwriting extraction fails: decide whether to implement GCP Document AI or document as a known limitation with a clear "next step" in README + Loom.
- This is a **decision point**, not a pre-planned phase.

### Phase B — Hard documents (only if quality gate triggers)

**Preferred path:** FastAPI on Railway exposing a small `/ocr` endpoint. GCP Document AI for form parsing and handwriting recognition. The Next.js app calls this service for documents that fail Phase A thresholds.

### Confidence scoring

- Gemini outputs **per-field confidence** (`high` / `medium` / `low`) as part of the structured schema.
- Low / missing → visible flags + correction tracking for the metrics dashboard.

---

## 5. Branding & theme

- **Palette:** Inspect Solum marketing site — dark near-black surfaces, white headings, muted gray body, cool accent. Encode as CSS variables for a single cohesive brand.
- **No theme switching UI** — one Solum-branded theme only.
- **Annie:** Photo avatar in the assistant drawer; professional, contextual assistant personality.

---

## 6. Git & history (Gitflow + visible phases)

- **Branches:** `main` = always deployable/latest demo; `develop` = integration; `phase/n-name` (e.g. `phase/1-extraction-mvp`) for workstreams.
- **Merge strategy:** merge phases into `develop`, then into `main` at stable checkpoints. Meaningful merge messages: *"Phase 1: extraction MVP"*. Tags optional (`v0.1-phase1`).
- **Rule:** no direct pushes to `main` that skip review — use PRs or disciplined local merge with clear messages.
- **Goal:** Loom + git history together tell the story of velocity and judgment over the build window.

---

## 7. Trello board

**Board:** [Technical Challenge Solum Health](https://trello.com/b/FsekKYdA/technical-challenge-solum-health) — lists: **ToDo**, **Doing**, **Done**, **Backlog**.

Agent creates/moves cards autonomously; escalate only on ambiguity or credentials.

---

## 8. Engineering hygiene (from day one)

- Biome + EditorConfig + Husky + strict TypeScript.
- GitHub Actions CI: Biome lint + type-check on push/PR.
- Vitest for schema mapping, confidence helpers, correction analytics.
- Playwright for at least one happy path + one failure path.
- **Model hygiene:** never ship stale or guessed model IDs. Before freezing defaults: check provider docs / model lists. Prefer env-driven `MODEL_ID` with README table: model, provider, date verified.

---

## 9. Documentation plan (for README, Loom, and personal notes)

1. Planning + architecture + ERD.
2. Stack choices + rationale + any deviations from employer stack.
3. **AI-assisted development:** Cursor modes (Ask, Plan, Agent); explain in Loom as *how* you worked.
4. Extraction phases + quality gate results + metrics.
5. "More time" improvements from backlog: voice assistant, GCP OCR hardening, batch processing, HIPAA.

---

## 10. Priority tiers

| Tier | Scope |
|------|--------|
| **P0** | Upload → extract → form + confidence → save → PDF (htmldocs) → correction metrics |
| **P1** | Supabase Auth + protected routes + RLS + polish |
| **P2** | Annie assistant (bespoke chat drawer with Gemini Flash streaming) |
| **P3** | Phase B OCR (GCP Document AI + FastAPI on Railway) — only if quality gate triggers |
| **Backlog** | Realtime voice (OpenAI Realtime API), batch processing, HIPAA hardening |

---

## 11. What I need in your first response

1. Architecture diagram (**Mermaid**): browser → Next.js → extraction → storage → PDF.
2. Phased plan with rough time boxes.
3. Model + provider recommendation with **"verify live on provider site"** step.
4. ERD if Postgres is in play.
5. Trello epics (MCP) if still appropriate.
6. Risk register (top 5).
7. Git init checklist + **first phase branch** name.

---

## 12. Constraints (keep visible throughout)

- **AI usage** in product **and** in how the repo was built — document for Loom.
- **Scrappiness > perfection** — ship, then iterate.
- **Human-in-the-loop** UX is non-negotiable quality bar.
- **Explain deviations** from employer stack.
- **Gitflow + phase-visible history** — §6.
- **Trello** — agent-led; user only for conflicts.
- **No i18n** in MVP.
