---
description: "Never embed specific product names, customer brands, or use-case-specific wording in app core logic; keep the app generic and use-case-agnostic."
alwaysApply: true
---

# No Hardcoded Use Cases

Application core logic (prompts, templates, placeholder text, component defaults) must remain **use-case-agnostic**. Specific product names, customer brands, and domain-specific terminology belong in configuration or user input — never in source code.

## Rule

1. **No customer/product names in code**: Prompts, placeholder strings, example text, and inline comments must use generic examples (e.g. `'Product Alpha'`, `'Analytics Suite'`), never real product names from a specific deployment or customer.

2. **No domain jargon in templates**: If a prompt template references industry-specific terms (e.g. `'Telcos'`, `'Enterprises'`, route patterns like `/reflector/*`), replace with generic equivalents (`'Enterprise users'`, `/product-a/*`).

3. **Configuration, not code**: Brand names, product lists, and domain context should come from:
   - User input at runtime (e.g. product discovery phase)
   - Project configuration or settings
   - Imported data (scanned content, uploaded docs)

4. **Placeholder text must be generic**: UI placeholders (e.g. `placeholder="e.g. Missing ProductName..."`) must not reference any real product or customer.

## Why

- The app serves **many use cases** — hardcoded names create confusion and bias in AI outputs.
- Specific names leak into LLM prompts, skewing results toward one customer's domain.
- Generic examples make the codebase portable, testable, and professional.

## Audit Checklist

When reviewing or writing code, check for:

- [ ] Product/brand names in string literals (prompts, placeholders, comments)
- [ ] Industry-specific terms in templates that should be generic
- [ ] Route patterns or URL examples referencing a specific deployment
- [ ] Example data that only makes sense for one customer
