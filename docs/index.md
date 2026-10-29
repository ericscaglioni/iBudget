# iBudget

Personal budget app: accounts, categories, transactions and a dashboard, one
currency at a time. This file is the starting point for every AI agent. Read it
first, then only the pages you need.

## Overview

What the product is, the stack, and the domain rules that must not be broken:
[product overview](product-overview.md).

## Getting started

- [How to develop](develop.md) — install, run, test, migrate, and the commands
  that exist.
- [UI and theme](ui.md) — shared components, palette, and how a screen should
  look. Follow this before any UI change.

## Architecture

Money lives in the server services. Routes are thin. The browser talks to the
API through client services. Do not put Prisma in a React component, and do not
put HTTP calls in a server service.

The decisions that most often go wrong if you skip them:

- A **transfer** is two linked transactions (`transferId`): expense on the
  source account, income on the destination. Lists show only the expense side.
  Create, edit and delete always update both sides together. Different
  currencies need `toAmount` (the amount received).
- The **dashboard** never mixes currencies. Same-currency transfers are
  invisible there. Cross-currency transfers count as expense in the source
  currency and income in the destination, and stay out of the category chart.
- **Auth** is Clerk. Pages redirect to `/login`. API handlers use
  `authHandler` and must answer 401 if nobody is signed in, not 500.
- **API shape** is `{ data }` on success and `{ error: { message, code } }` on
  failure (`createSuccessResponse` / `createErrorResponse`).
- **Lists** keep `page`, `pageSize` (10 / 20 / 50 / 100, default 20), sort and
  filters in the URL.
- **Tests** (Vitest) cover `src/lib`, `src/app/api`, Zod schemas and the
  shared UI kit, with an 85% coverage gate. Mock Prisma; do not hit a
  database. Component tests live next to the file (`Foo.test.tsx`) and run
  in jsdom.

Folder map, request flow, deploys and the database: [architecture](architecture.md).

## Templates

When adding a changelog entry or writing down a design choice, start from these
rather than inventing a new shape:

- [Changelog entry](templates/changelog.md)
- [Design record](templates/design-record.md)

Before any **new feature** code, write a design record in
[docs/design](design/) (`proposed` → user approves → then code). The
`design-record` skill is the workflow. Skip a new record for routine bug
fixes.
