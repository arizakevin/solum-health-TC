# AI development tooling

How this repo is developed with **Cursor**: agents, rules, skills, browser automation, and MCP integrations.

For **verbatim copies** of the rules and skills used here, see [`docs/agent/`](./agent/README.md). Those files are documentation snapshots; the live versions live in **global** Cursor configuration so the project does not ship a duplicate `.cursor/rules` tree.

The skills documented there are **custom workflows** designed and refined over time for this development setup (with Supabase-authored material where the skill package indicates it).

---

## Cursor

[Cursor](https://cursor.sh) is an AI-native editor (VS Code–compatible). The **Agent** can edit files, run commands, use MCP tools, and use the browser tools when enabled.

### Agent modes

| Mode | When used |
|------|-----------|
| **Agent** | Default: implement and run tools/commands. |
| **Plan** | Read-only planning when trade-offs matter before coding. |
| **Ask** | Read-only Q&A. |
| **Debug** | Investigation with runtime evidence. |

---

## Rules and skills

- **Rules** are standing instructions (coding standards, guardrails). In Cursor they are configured under **Settings → Rules** (global and/or project).
- **Skills** are structured task playbooks the agent can load when relevant.

This repository keeps **read-only mirrors** under [`docs/agent/`](./agent/README.md) so collaborators can read what shaped development without checking copies into `.cursor/`.

### Rules mirrored in `docs/agent/rules/`

| Rule | Scope | Summary |
|------|-------|---------|
| `no-zombie-code` | Always | Revert or remove failed attempts; do not stack dead code paths. |
| `modularity-design` | Always | Small modules, composition, avoid tight coupling. |
| `no-hardcoded-use-cases` | Always | Keep core prompts and examples domain-neutral. |
| `react-patterns` | `**/*.tsx` | Presentational vs container patterns; Next.js App Router conventions. |

### Skills mirrored in `docs/agent/skills/`

| Skill | Use |
|-------|-----|
| `supabase` | Supabase surfaces, MCP usage, auth/RLS/storage pitfalls. |
| `supabase-postgres-best-practices` | Postgres queries, indexes, pooling, RLS performance. |
| `biome-lint-fix` | Run Biome check/write and fix lint issues. |
| `react-best-practices` | React performance patterns (see `reference.md` in that folder). |

---

## MCP servers

[Model Context Protocol](https://modelcontextprotocol.io) exposes typed tools to the agent. Typical setup for this project:

| Server | Role |
|--------|------|
| **Supabase** | Database, auth, storage, and related MCP tools when the Supabase MCP is connected. |
| **Trello** | Board and card updates from the IDE. |
| **Vercel** | Deployments, logs, environment configuration. |

Exact tool counts and names depend on the MCP version and what Cursor lists under **Settings → Tools → Installed MCP Servers**.

### Browser automation

Under **Settings → Tools → Browser**, connecting to a **Browser** tab lets the agent open localhost, interact with the page, and inspect console/network output when you use that workflow.

---

## Transcripts

Cursor may store session transcripts under `~/.cursor/projects/<project-id>/agent-transcripts/` for continuity across chats.
