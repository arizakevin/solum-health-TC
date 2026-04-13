# Documentation

Index of everything under **`docs/`**. Clone setup, env vars, and day-to-day commands stay in the **[root `README.md`](../README.md)**.

---

## Product and architecture

| Doc | What it covers |
|-----|------------------|
| [**Implementation plan**](./implementation-plan.md) | Architecture, ERD, phased delivery, risks, stack choices |
| [**Wireframes**](./wireframes/README.md) | Screen-by-screen layouts and navigation flow (PNG walkthrough) |

---

## AI, extraction, and document quality

| Doc | What it covers |
|-----|------------------|
| [**LLM model decisions**](./llm-model-decisions.md) | Model picks for extraction and Annie, cost vs quality |
| [**Extraction architecture**](./extraction-architecture.md) | Provider defaults, fallback chain, file layout, production recommendations |
| [**Extraction confidence**](./extraction-confidence.md) | Logprobs, dual-provider scoring, case-level metrics |
| [**Document AI OCR**](./document-ai-ocr.md) | Optional Google Cloud Document AI for scans and handwriting |

---

## Challenge context and journal

| Doc | What it covers |
|-----|------------------|
| [**Technical challenge master prompt**](./technical-challenge-master-prompt.md) | Employer spec summary and planning brief for collaborators |
| [**Dev log**](./DEVLOG.md) | Day-by-day build notes and decisions |

---

## Development and AI tooling

| Doc | What it covers |
|-----|------------------|
| [**AI tooling**](./ai-tooling.md) | Cursor agents, modes, MCP, how this repo is developed |
| [**Agent rules and skills**](./agent/README.md) | Snapshot of Cursor rules and skill packages used on the project |

---

## Folder map

```
docs/
├── README.md                 ← you are here
├── implementation-plan.md
├── extraction-confidence.md
├── llm-model-decisions.md
├── document-ai-ocr.md
├── technical-challenge-master-prompt.md
├── DEVLOG.md
├── ai-tooling.md
├── agent/                    # rules + skills (see agent/README.md)
└── wireframes/               # PNGs + wireframes/README.md
```
