---
description: "React component architecture – Container-Presentational and Atomic design. Apply when building or refactoring components in this project."
globs: "**/*.tsx"
alwaysApply: false
---

# React Component Patterns

When building or refactoring React components in this project, align with the **react-best-practices** skill snapshot in [`docs/agent/skills/react-best-practices/`](../skills/react-best-practices/) (performance and structure), and the conventions below.

## Project Conventions

- **Presentational components**: Prefer `src/components/ui/` for shared atoms and molecules
- **Feature/container components**: Logic-heavy components in `src/components/` or feature folders
- **Custom hooks**: Extract reusable logic into `src/hooks/`
- **Server Components**: Prefer React Server Components for data-fetching pages; use `"use client"` only at the boundary where interactivity is needed
- **Keep components focused**: Consider splitting when a component exceeds ~150 lines

## Quick Reference

- Containers: data, state, side effects → pass props down
- Presentational: receive props, render UI only
- Atomic hierarchy: atoms → molecules → organisms → templates → pages
- Next.js App Router: pages in `src/app/`, shared UI in `src/components/`
