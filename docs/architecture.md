# Architecture

## Folders

```
src/app/                 pages, layouts, and src/app/api route handlers
src/app/<page>/_components   client UI for that page
src/app/<page>/schema.ts     Zod schema for that page's forms
src/components/ui        shared kit (Button, Modal, Table, …)
src/lib/server/services  Prisma, domain rules, the only place money is computed
src/lib/client/services  browser calls to /api (get / post / patch / put / del)
src/lib/api              fetch wrappers; unwrap `{ data }`, throw AppError
src/lib/middlewares      authHandler (Clerk userId or 401)
src/lib/errors           AppError, ValidationError, NotFoundError
src/lib/utils            dates, money formatting, query parsing, toasts
src/test                 Prisma mock and HTTP helpers for tests
prisma/                  schema and migrations
docs/                    this documentation
```

## Request flow

```
UI (modal / table / dashboard)
  → src/lib/client/services  (builds the URL and body)
    → src/lib/api/client     (fetch, unwrap `{ data }`)
      → src/app/api/*/route.ts
        → authHandler        (401 if signed out)
          → src/lib/server/services
            → prisma
```

Server-rendered pages may call a server service directly. They still must not
import the client API module.

Route handlers stay thin: parse the request, call one service, return
`createSuccessResponse` / `createErrorResponse`. If a route talks to Prisma
itself, the domain checks in the service (ownership, "cannot delete with
transactions", …) are skipped — do not do that.

## Auth

- `src/middleware.ts` sends unsigned visitors to `/login`, except `/login`,
  `/api/clerk/*` and `/__clerk/*`.
- Production Clerk uses a same-origin Frontend API proxy at `/__clerk` (the
  production domain is a `vercel.app` host, so a `clerk.` CNAME cannot be
  set). `NEXT_PUBLIC_CLERK_PROXY_URL` is set only on the Prod Vercel project.
  Local and QA use Clerk development and do not set that variable.
- Session routes wrap the handler in `authHandler`. A missing user is **401**,
  not a thrown `Error` that becomes 500.
- `/api/clerk/webhook` verifies the Svix signature with
  `CLERK_WEBHOOK_SIGNING_SECRET`, then upserts `users` (name and email from
  Clerk), `initializeUserDefaults`, or `deleteUserData`. There is no public
  HTTP API that deletes a user's data. Clerk remains the login source of
  truth; `users` is only a local directory for joins.
- Writes that insert a `userId` (accounts, categories, transactions, settings,
  dismissed tips) call `ensureUserRow` first, so a missing webhook — typical
  when developing locally — cannot fail the foreign key. If name and email
  are empty, they are copied from Clerk. Creating an account, and opening the
  dashboard, also run `initializeUserDefaults` so default categories exist.

## Data that must stay consistent

- **Transfers.** Two rows, same `transferId`. Resolve the transfer from the
  database (the id of the row being edited), never from a `transferId` the
  client volunteers. Cross-currency requires a numeric `toAmount`.
- **Calendar dates.** Parse and filter with `parseCalendarDate` /
  `getMonthDateRange` in `src/lib/utils/format.ts`. The browser sends
  `YYYY-MM-DD`; the database stores UTC midnight. Month filters and
  `formatDate` use UTC so the 1st of a month cannot fall into the previous
  one.
- **Balances.** `initialBalance` plus income minus expense, including both
  sides of a transfer, excluding future dates (`date <= now`).
- **Dashboard month.** See [product overview](product-overview.md) — same
  currency vs currency exchange. Account balances are as of today. Monthly
  totals include booked future months through the latest transaction date.
  The six-month chart is the six months ending at the current month, or at
  the latest booked month if that is later.
- **Account order.** Nullable `sortOrder`. Ordered accounts first, then
  never-ordered ones by name. Reorder is per currency
  (`PUT /api/accounts/order`).
- **Descriptions.** `normalizeDescription` on create **and** edit (trim,
  required, max length). Do not run the search sanitizer on saved text; it
  strips punctuation and accents.

## Errors

```ts
{ data: T }                                  // success
{ error: { message: string, code?: string } } // failure
```

`AppError` carries `statusCode` and `code`. Unexpected errors become 500 with
`INTERNAL_SERVER_ERROR` and no internal details in the body.

## Deploys and the database

| | QA | Production |
|---|----|------------|
| Git branch | `develop` | `main` |
| Vercel project | `qa-ibudget` | `ibudget` |
| Build | `vercel-build` (migrate deploy, then generate, then `next build`) | same |

A migration in a release is applied to the QA database when `develop` is
pushed, and to Prod when `main` is updated. There is no separate migrate step.
Do not run migrations against those databases from a laptop.

QA and Prod `DATABASE_URL` values on Vercel are Sensitive and cannot be
copied back. If Railway's Database tab or DBeaver fail with access denied
while the app still works, recover as in
[How to develop](develop.md#recovering-a-vercel-only-database-password).
QA was recovered 2026-10-28; Prod has not been.
