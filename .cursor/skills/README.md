# Agent Skills

Project-specific skills live here. Global skills (commit-push, code-review, project-management, etc.) are maintained in the central [agent-skills-rules](https://github.com/kevinreber/agent-skills-rules) repository and are available to the agent via `~/.cursor/skills/`.

## Active global skills for this project

| Skill | Trigger |
|-------|---------|
| `supabase` | Any Supabase/PostgreSQL/auth task |
| `supabase-postgres-best-practices` | Query optimization, schema design |
| `code-review` | Pull request or code review requests |
| `commit-push` | `/commit-push` or "commit and push" |
| `project-management` | Multi-step task tracking |
| `master-plan` | Refactors, large features |
| `persistent-problem-investigate` | Repeated failed fixes |
| `react-component-patterns` | Component architecture |
| `stripe-best-practices` | Stripe integration questions |

## Adding project-specific skills

Place a new skill at `.cursor/skills/<name>/SKILL.md` and register it in `docs/ai-tooling.md`.
