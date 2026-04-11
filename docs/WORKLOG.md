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
