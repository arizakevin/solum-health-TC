---
description: "Never leave stale or zombie code behind when a fix/refactor fails; revert dead code before trying a new approach."
alwaysApply: true
---

# No Zombie Code

When applying changes (fixes, refactors) that do **not** solve the original issue:

1. **Assess first**: Why didn't it work? Is the approach sound but needs refinement?

2. **Two paths**:
   - **Iterate**: If the solution direction is correct—refine, extend, or fix that code. Build on top of it.
   - **Abandon & revert**: If the approach was wrong—remove the non-functional code *before* applying a new fix. Do not layer another attempt on top of dead code.

3. **Never leave zombie code**: Code that did not fix the issue and is no longer part of the solution must be reverted or removed.

## Examples

**❌ BAD** – Layering new attempts over failed code:

```typescript
// Attempt 1: didn't work
function fetchData() { /* dead logic */ }
// Attempt 2: different approach
async function fetchDataRetry() { /* new logic */ }
// Both remain, unclear which is used
```

**✅ GOOD** – Revert, then apply new approach:

```typescript
// Reverted failed attempt, then:
async function fetchData() { /* clean, working logic */ }
```

**✅ GOOD** – Iterating on a sound approach:

```typescript
// Original had the right idea but missed an edge case
async function fetchData() {
  const result = await api.get();
  // Added: handle null/empty response
  return result ?? [];
}
```

## Goal

Keep a clean codebase where it is clear what code is active, what it does, and why. Avoid confusion and debugging of abandoned code paths.
