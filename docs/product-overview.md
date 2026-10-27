# Product overview

iBudget is a personal budget app. A signed-in user has accounts (each in one
currency), categories, and transactions (income, expense, or a transfer between
accounts). The dashboard shows one currency at a time: balances, the month's
income and expenses, and a short history.

This page used to live as Cursor-only context in
`.cursor/rules/ibudget-context.yaml`. That file is gone; this is the source of
truth.

## Stack

- **Next.js** 15 (App Router) and **React** 19. Prefer Server Components;
  `'use client'` only when the screen is interactive.
- **TypeScript**. **Zod** for form and payload shapes (with React Hook Form on
  the client).
- **Prisma** 6 with **MySQL** (not PostgreSQL). Local database is
  `localhost:3306/ibudget`. Hosted databases are on Railway. Prisma Client is
  used from server services, not from React.
- **Tailwind CSS** and `clsx`. Theme, components and checklist: [UI](ui.md).
- **Clerk** for auth. The Clerk webhook (`/api/clerk/webhook`) creates default
  categories for a new user and deletes their data when the Clerk user is
  removed. That route is public to the network and is authenticated by the
  Svix signature, not by a session.
- **dayjs** for every date. Do not use `Date` math for calendars or recurrences.
- Toasts: **Sonner**, through `showSuccess` / `showError` / `showInfo` in
  `@/lib/utils/toast`.
- Tables: **@tanstack/react-table**. Filters, sort, page and page size live in
  the URL.
- Charts: **recharts**.
- Tests: **Vitest**, Prisma mocked. See [develop](develop.md).

Avoid adding libraries when Fetch, `URLSearchParams` or the existing kit will do.

## Domain

- A transaction is `income` or `expense`. A **transfer** is not a third
  database type: it is two rows that share a `transferId` (expense on the
  source account, income on the destination), both in the system "Transfer"
  category (`userId` null).
- Listings show only the expense side of a transfer. Editing one loads the
  other side from `GET /api/transactions/transfer/[transferId]` and saves both
  together.
- Amounts are stored as positive decimals. The sign is the `type`.
- Recurring transactions share a `recurringId`. Updates and deletes can apply
  to one occurrence or to this one and every later one (`updateScope` /
  `scope=future`).
- Categories are income or expense. Default categories are cloned per user on
  signup; "Transfer" stays shared.
- Each account has one currency. The dashboard never adds two currencies
  together. The user can pick a default currency only from currencies they
  actually hold.
- Cross-currency transfers: the amount sent is an expense in the source
  currency, the amount received is income in the destination currency. They
  do not appear in the category chart. Same-currency transfers do not count
  as income or expense.

## How features are shaped

- Forms live in modals (`FormModal`), not in dedicated pages.
- Filters sit above the table and write to the URL.
- Create / update / delete show a toast and then `router.refresh()`.
- A floating button opens the new-transaction modal from every signed-in page.
- Split UI into small components. Put repeated form or fetch logic in a hook.
  Keep client services (`src/lib/client/services`) as the only place the
  browser talks to `/api`. Keep Prisma in `src/lib/server/services`.
- Errors use `AppError` / `ValidationError` / `NotFoundError`. User-facing
  copy is a full sentence, not an internal code name.
