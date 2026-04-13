---
name: persistent-problem-investigate
description: Guides the agent when fixes have been attempted repeatedly with no success. Use when the user says a bug persists, the issue is still there, previous attempts failed, or changes have no effect. Prompts investigation-first thinking and alternative approaches before more code changes.
---

# Persistent Problem — Investigate Before Changing

## When to Use This Skill

The user indicates that a problem **still persists** after one or more fix attempts. The agent has been making changes with no success. Do not repeat the same approach.

## Stop and Investigate First

1. **Do not add more of the same.** If overflow constraints failed, adding more will likely fail too. If style tweaks failed, more tweaks will likely fail. Identify what was tried and avoid repeating it.

2. **Change perspective.** Consider:
   - The cause might be *outside* the obvious scope (parent chain, sibling, document-level, a dependency)
   - Third-party code (libraries, components) may have known bugs or surprising behavior
   - The symptom and the cause may be in different parts of the system

3. **Trace the full chain.** For layout: from the affected element up to `<html>`. For logic: from the symptom back to the source. For performance: identify the actual bottleneck. Map the system before changing it.

4. **Side effects and timing.**
   - Does the issue only appear in a specific state (e.g. when a dropdown is open)?
   - Could focus, animations, or portal mounting affect behavior?
   - Are there race conditions or async timing issues?

5. **Alternative hypotheses.**
   - Search for known issues in the libraries involved
   - Consider architectural changes (replace a component, change the approach) rather than patching symptoms

## Investigation Checklist

- [ ] Reproduce and note exactly when the issue appears
- [ ] List what has already been tried
- [ ] Trace the relevant chain (DOM, call stack, data flow)
- [ ] Search for library/dependency issues related to the behavior
- [ ] Formulate a hypothesis before implementing

## Only After Investigation

Implement a fix that targets the *identified cause*, not the symptoms. Prefer structural changes over incremental patches.

## Resolved Example

*LLM Settings overflow (db-schema-designer):* Multiple overflow/min-width constraints had no effect. Investigation revealed the Radix ScrollArea viewport uses `display: table`, which expands the parent when content overflows (radix-ui/primitives#2722). The fix was to replace ScrollArea with a plain scrollable element—an architectural change rather than more constraints.
