---
name: design-record
description: >-
  Writes and updates iBudget design records in docs/design before any new-feature
  code. Use when starting a new feature, when the user says design-record or
  "new feature", when a product choice needs a written record, or before
  implementing something that is not a routine bug fix.
---

# Design record

A design record is the written argument for a feature: the request, why it
matters, what other apps do, the plan, and the risks. Other people (and later
you) should be able to understand the feature and future changes from that
file.

Records live in `docs/design/`. The shape to copy is
[docs/templates/design-record.md](../../../docs/templates/design-record.md).

## When to use

**Before touching any code** when the user says you are going to work on a new
feature, or the work is a product choice (what to show, how money counts, how
a flow should feel).

Skip a new record for routine bug fixes and tiny copy/layout tweaks. If an
existing record already covers the behaviour, update that file instead of
starting a second one.

## Statuses

| Status | Meaning |
|--------|---------|
| `proposed` | Written for review. Do not write feature code. |
| `approved` | The user approved this plan. Implementation may start. |
| `implemented` | Built as described **and committed**. |
| `superseded` | A later record replaced this one. Link it. |

Older records may say `accepted` instead of `approved`. Treat that as approved.

## Workflow

1. **Name the file** `docs/design/YYYYMMDD-short-title.md` (today's date, kebab-case).
2. **Fill the template** from the user's request. Restate the problem in plain
   language. Add other-apps context when it helps. Put unanswered product
   questions in **Questions** (do not hide them in chat-only). Write a concrete
   **Plan** and **Risks and considerations**.
3. **Stop at `proposed`.** Tell the user the file path and wait. Discuss. Edit
   the record as the plan changes. Keep a short line in **Decision history**
   for each revision (what changed and why).
4. **When they approve** (they say the approach is right, "go ahead", "work on
   it", "approved", or equivalent), set status to `approved` and only then
   write code. Follow the Plan. Do not silently reverse it.
5. **When the work is committed** in the shape the record describes, set status
   to `implemented`. If the implementation had to diverge, update the record
   first so it still matches the code.

If they approve in the same message that asked for the record ("I like that,
build it"), write the record as `approved` and implement in that turn. Still
write the file before the code.

## While proposed

- Change the document, not the app.
- Prefer answering **Questions** in the file over inventing a default.
- Do not start a second record for the same feature; revise this one.

## What not to do

- Do not copy this skill into Cursor rules.
- Do not invent a parallel folder (`docs/design-records`, etc.).
- Do not mark `implemented` before the matching commit exists.
- Do not skip the record because the plan "already lives in chat".
