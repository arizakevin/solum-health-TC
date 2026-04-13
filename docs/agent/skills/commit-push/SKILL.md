---
name: commit-push
description: Creates proper git commits with well-formed messages and pushes changes. Use when the user asks to commit, push, save changes, or finish a task with version control.
---

# Commit & Push

When creating git commits and pushing changes, follow this workflow.

## When to Use

- User asks to "commit", "push", "commit and push", or "save changes to git"
- User asks to "finish" or "wrap up" after making changes
- At the end of a multi-step task when the user expects changes to be committed
- When the user explicitly requests a commit or push

## Instructions

1. **Review changes first**
   - Run `git diff --stat` to see which files changed
   - Run `git diff` for full diff when the change set is small or when you need detail for the message
   - Run `git status` to check for untracked files and branch state

2. **Stage all relevant changes**
   - **Important**: Always run `git add -A` (or `git add <paths>`) before committing. Unstaged changes will NOT be included in the commit.
   - Use `git add -A` to stage everything in the repo, or `git add <paths>` for selective staging
   - Verify with `git status` that all intended files show as "Changes to be committed"
   - Unstage anything that should not be committed (e.g. `.env`, `node_modules`)

3. **Create a proper commit message**
   - Use [Conventional Commits](https://www.conventionalcommits.org/) when appropriate:
     - `feat:` for new features
     - `fix:` for bug fixes
     - `refactor:` for code changes that are neither feature nor fix
     - `docs:` for documentation only
     - `chore:` for maintenance (deps, config, etc.)
   - Write a clear, concise subject line (50 chars or less when possible)
   - Add a blank line and a body that summarizes the key changes, grouped by area
   - Include specific details: what was added, changed, or fixed
   - Do NOT use generic messages like "Update files" or "Fix stuff"

4. **Commit and push**
   - Run `git commit -m "subject" -m "body"` for multi-line messages, or use a single `-m` for short messages
   - Run `git push`
   - If the push fails (e.g. branch not tracked), run `git push -u origin <branch>` as needed

5. **Handle pre-commit hooks**
   - If lint/format hooks fail, fix the reported issues and try again
   - Do not skip hooks unless the user explicitly asks to

## Example

```
feat: add Seeds tab and Data Grid

Seeds:
- Add Seeds tab with sidebar, CodeMirror editor, run/delete
- AI seed generation via seed-data blocks

Data Grid:
- SQL Console / Data Grid toggle with pagination
- Timestamp prefill for created_at, updated_at columns
```
