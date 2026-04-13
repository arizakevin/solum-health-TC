# AI Development Tooling

This document describes the AI-assisted development setup used on this project: the IDE, agent rules, skills, and MCP server integrations.

---

## Cursor IDE

Development is done in [Cursor](https://cursor.sh), an AI-native IDE built on VS Code. Cursor exposes an **Agent** that can read and write files, run terminal commands, call MCP tools, and browse the web autonomously.

### Agent modes

| Mode | When used |
|------|-----------|
| **Agent** | Default implementation mode — full tool access for writing code and running commands |
| **Plan** | Read-only design mode for multi-step tasks with trade-offs before committing to code |
| **Ask** | Read-only Q&A and exploration; no file changes |
| **Debug** | Systematic investigation of runtime errors with DevTools evidence |

---

## Rules

Rules are persistent instructions loaded into every agent context. They enforce coding standards, prevent anti-patterns, and keep the codebase consistent across sessions.

Rules live in `.cursor/rules/` as `.mdc` files. The canonical source for all rules is the central [`agent-skills-rules`](https://github.com/kevinreber/agent-skills-rules) repository; derived Cursor `.mdc` files are generated from there and copied into each project.

### Rules active in this project

| Rule | Scope | Description |
|------|-------|-------------|
| `no-zombie-code` | Always | Never leave dead code from failed fix attempts; revert before retrying |
| `modularity-design` | Always | SOLID principles, low coupling, single-responsibility components |
| `no-hardcoded-use-cases` | Always | Keep prompts and templates use-case-agnostic; no customer names in source |
| `react-patterns` | `**/*.tsx` | Container-Presentational architecture; prefer Server Components at the page level |

### Adding or updating rules

1. Edit or create the canonical rule in `~/Development/agent-skills-rules/rules-canonical/<scope>/<name>.md`.
2. Run `node scripts/sync-rules.mjs` to derive `.mdc` and Antigravity `.md` versions.
3. Copy the derived `.mdc` to `.cursor/rules/` in this project.
4. Commit both repos.

---

## Skills

Skills are structured prompt documents that give the agent specialized domain knowledge for a specific task. They are invoked either automatically (when relevant) or manually with `/skill-name` in chat.

Global skills are maintained in [`agent-skills-rules`](https://github.com/kevinreber/agent-skills-rules) and symlinked into `~/.cursor/skills/`. A reference list of active skills for this project lives in `.cursor/skills/README.md`.

### Skills used during development

| Skill | Trigger / when used |
|-------|---------------------|
| `supabase` | Any task involving the Supabase MCP, PostgreSQL, or auth |
| `supabase-postgres-best-practices` | Query optimization, schema design, index strategy |
| `code-review` | Pull request reviews or on-demand code review |
| `commit-push` | `/commit-push` — stages, commits with conventional message, and pushes |
| `project-management` | Multi-step feature work; keeps a running to-do list |
| `master-plan` | Creates a high-level roadmap before large refactors |
| `persistent-problem-investigate` | When fixes have been attempted multiple times with no success |
| `react-component-patterns` | Component architecture guidance for React/Next.js |
| `stripe-best-practices` | Stripe Checkout, subscriptions, webhooks |
| `sync-new-skills-rules` | Syncs a new skill or rule to the central repo |
| `browser-debug-loop` | Iterative fix-and-verify loop using browser DevTools |

---

## MCP Servers

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers give the agent direct, structured access to external services without copy-pasting tokens or writing glue scripts. Each server exposes a set of typed tools the agent calls at runtime.

### Installed and active servers

#### Supabase (`user-supabase`)

- **Purpose**: Direct access to the project's Supabase instance — database queries, schema inspection, auth management, storage, Edge Functions.
- **Tools available**: 29 tools (table reads/writes, SQL execution, auth user management, bucket operations, function invocations, etc.)
- **When used**: Schema migrations, data debugging, running queries during development, verifying RLS policies.

#### Trello (`user-trello`)

- **Purpose**: Project management — reading and updating the development board without leaving the IDE.
- **Tools available**: 45 tools (list boards/cards, create cards, move cards, add labels/comments, manage checklists, etc.)
- **When used**: Moving tasks to "Done", creating cards for new features or bugs, adding acceptance criteria comments.
- **Board**: `AuthScribe Dev Board` — columns: Backlog → In Progress → In Review → Done.

#### Vercel (`user-vercel`)

- **Purpose**: Deployment management — inspect deployments, environment variables, project settings.
- **Tools available**: 18 tools + 12 prompts (list deployments, get deployment logs, manage env vars, trigger redeploys, etc.)
- **When used**: Checking deployment status after a push, inspecting build logs, managing preview vs production environment variables.

#### Browser Automation (`cursor-ide-browser`)

- **Purpose**: Live browser interaction for frontend testing and verification.
- **Capabilities**: Navigate pages, take screenshots, inspect the accessibility tree (aria snapshot), click/type/fill forms, read console logs and network requests, run performance profiles.
- **When used**: Verifying UI changes in the running dev server, debugging visual or interaction regressions, end-to-end smoke tests.

### Adding a new MCP server

1. Open Cursor Settings → Tools → MCP Servers → `+ New MCP Server`.
2. Provide the server identifier and connection config.
3. Document it in this file under the appropriate subsection.

---

## Agent Transcripts

Cursor persists conversation history for each project in `~/.cursor/projects/<project>/agent-transcripts/`. Past sessions can be referenced by UUID when continuing multi-session work. The agent cites them as `[short title](uuid)`.

---

## Central Reference Repository

All rules and skills across projects are centralized in:

```
~/Development/agent-skills-rules
```

Structure:

```
rules-canonical/          # Canonical rule sources (YAML frontmatter + Markdown body)
  global/                 # Always-apply rules
  scoped/frontend/        # TSX-specific rules
rules/                    # Derived Cursor .mdc files (generated by sync-rules.mjs)
antigravity-rules/        # Derived Antigravity .md files
skills/
  global/                 # Cross-project skills
  scoped/                 # Stack-specific skills
scripts/
  sync-rules.mjs          # Derives rules/ and antigravity-rules/ from rules-canonical/
  ensure-symlinks.mjs     # Ensures ~/.cursor/skills/ and ~/.gemini/antigravity/ symlinks
```

When a new rule or skill is created for this project, it should be mirrored to `agent-skills-rules` if it is reusable across projects.
