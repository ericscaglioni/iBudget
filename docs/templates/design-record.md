# Design record

A written argument for a feature, so later work does not silently reverse it
and other people can see what we thought and why.

Use one when starting a **new feature**, or when the options were not obvious
(for example how currency exchanges show on the dashboard). Skip it for
routine bug fixes.

Save as `docs/design/YYYYMMDD-short-title.md`. Agents follow the
`design-record` skill: write this file **before any feature code**, leave it
`proposed` until the user approves, then `implemented` only after the matching
commit.

```markdown
# Title

- Status: proposed | approved | implemented | superseded
- Date: YYYY-MM-DD
- Supercedes: (link, or "none")

## Request

What we were asked to do, in language a user of the app would recognise.

## Reasoning

Why this is a problem worth solving, and who it helps.

## Questions

Open product questions. Leave this section in while status is proposed; write
"None — approved as written." once they are settled.

## Context from other apps

How comparable apps handle this (or why they do not). Name the apps.

## Plan

What we will build, including what we are explicitly not doing.

## Risks and considerations

What could go wrong, invariants that must stay true (money, currencies,
transfers), and anything easy to "fix" later by accident.

## Decision history

- YYYY-MM-DD: proposed.
- YYYY-MM-DD: revised — what changed and why.
- YYYY-MM-DD: approved.
- YYYY-MM-DD: implemented (commit / version).
```

Older records may use `accepted` instead of `approved`, and a shorter
Context / Options / Decision / Consequences shape. Do not rewrite them;
treat `accepted` as approved.
