# Design record

A short note of a choice that future work should not silently reverse. Use one
when the options were not obvious (for example how currency exchanges show on
the dashboard). Skip it for routine bug fixes.

Save as `docs/design/YYYYMMDD-short-title.md` (create `docs/design/` when you
write the first one).

```markdown
# Title

- Status: proposed | accepted | superseded
- Date: YYYY-MM-DD
- Supercedes: (link, or "none")

## Context

What is going on, and why a decision is needed. Include the user-visible
behaviour if there is one.

## Options

1. **Name.** What it would do. Who it is better for. What it costs.
2. **Name.** …

## Decision

Which option, in one or two sentences, in language a user of the app would
recognise.

## Consequences

What now has to stay true in the code (invariants, API shape, migrations).
What we are explicitly not doing, so it does not get "fixed" later.
```
