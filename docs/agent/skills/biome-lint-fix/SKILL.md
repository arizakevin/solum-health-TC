---
name: biome-lint-fix
description: Uses Biome to lint and format code, fixing common issues automatically. Use when the user asks to lint, format, fix lint errors, or when working with Biome in the project.
---

# Biome Lint & Fix

When this skill is activated, follow these steps:

1. Run `npx @biomejs/biome check --write <file_path>` to lint and format.
2. If errors remain, analyze the Biome output and suggest manual fixes.
3. Ensure that imports are sorted according to Biome's default conventions.
