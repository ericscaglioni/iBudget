# How to develop

## Run it locally

1. `npm install`
2. A `.env` with `DATABASE_URL` (local MySQL at `localhost:3306/ibudget`) and
   the Clerk keys. Do not print those values, commit `.env`, or paste secrets
   into chat.
3. `npx prisma migrate deploy` (or `npm run db:migration_status` to see what
   is pending).
4. `npm run dev` — [http://localhost:3000](http://localhost:3000)

## Commands

| Command | What it does |
|---------|----------------|
| `npm run dev` | Next.js dev server |
| `npm run lint` | ESLint |
| `npm run tsc` | `tsc --noEmit` |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watch |
| `npm run test:coverage` | Vitest plus the 85% coverage gate |
| `npm run db:migration_new` | Create a migration SQL file, do not apply it |
| `npm run db:migration_apply` | `prisma migrate dev` (local) |
| `npm run db:migration_status` | Which migrations are applied |
| `npm run db:seed` | Seed |
| `npm run init:users` | Upsert `users` (name/email from Clerk) and default categories for every Clerk user. Does not print emails. |
| `npm run build` | `prisma generate && next build` (no migrate) |
| `npm run vercel-build` | Migrate, generate, optional DB-password adopt, then `init:users`, then `next build`. Vercel runs this, so a new migration is applied on QA (`develop`) then Prod (`main`). |

## Tests

- Files sit next to the code: `foo.test.ts` beside `foo.ts`.
- Prisma is mocked (`src/test/mock-prisma.ts`). Tests must not need a database.
- Coverage is measured on `src/lib`, `src/app/api`, Zod `schema.ts` files and
  the shared UI kit (`src/components/ui`, the getting-started guide, PageShell).
  Pages, providers and the large table/combobox widgets are not in the 85% gate.
- After changing logic or an API route, run `npm test`. Before a release, also
  `npm run tsc`, `npm run lint` and `npm run test:coverage`.

## Changing the database

- Add a Prisma migration; never edit a migration that has already run on QA or
  Prod.
- Do not apply migrations to the QA or Prod databases by hand. The Vercel
  build does `prisma migrate deploy`.
- Say so in the changelog when a release includes a migration.

## UI work

Follow [UI and theme](ui.md). After a UI change, exercise the flow in the
browser the way a user would (not only a screenshot of the first render).
Check the other pages that share the state you touched.

## New features

Write a [design record](templates/design-record.md) in `docs/design/` and wait
for approval before feature code. Status moves `proposed` → `approved` →
`implemented` (after the matching commit). The `design-record` skill is the
workflow. Skip this for routine bug fixes.

## Git and releases

- Do not commit unless asked. Do not push, delete branches, or force-push
  unless asked.
- Versions follow [SemVer](https://semver.org/). Git tags have **no** `v`
  prefix (`0.4.0`, not `v0.4.0`).
- Changelog: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Write
  for the user ("the dashboard now counts…"), not for the diff. Template:
  [changelog](templates/changelog.md).
- Release train, in order: version bump + changelog on a `vX.Y.Z` branch →
  fast-forward `develop` and push (QA builds, migrations run) → PR
  `develop` → `main` → merge → annotated tag on the **merge commit** →
  fast-forward `develop` to `main`. Wait until QA is READY before merging to
  `main`.
- Vercel: project `qa-ibudget` deploys `develop` (Preview). Project `ibudget`
  deploys `main` (Production). Each project ignores the other branch.

## Recovering a Vercel-only database password

After the 2026-10-21 Railway incident, QA and Prod passwords were rotated
inside MySQL (`scripts/rotate-db-password.sh`) and saved only as Vercel
`DATABASE_URL`. That variable is **Sensitive**: the dashboard, API and this
agent cannot read it back. Railway still has the old `MYSQLPASSWORD` /
`MYSQL_ROOT_PASSWORD`, so Railway's Database tab and DBeaver (if copied from
Railway) fail with `Access denied for user 'root'`.

QA was recovered on 2026-10-28. Use the same path for **Prod** when needed.
Do not print the password, URL, or `TARGET_DB_PASSWORD`. Copy the new URL to
the clipboard and a password manager.

1. Confirm `scripts/adopt-db-password-from-env.mjs` is in the branch that
   Vercel will build (`develop` for QA, `main` for Prod). `vercel-build`
   runs it after `prisma migrate deploy`. It is a no-op unless
   `TARGET_DB_PASSWORD` is set (32–64 alphanumeric chars).
2. Set `TARGET_DB_PASSWORD` on the Vercel project as **encrypted**, not
   Sensitive (`qa-ibudget` Preview+Production, or `ibudget` Production).
3. Deploy. Migrate still uses the old `DATABASE_URL`; the script then
   `ALTER USER`s `root@%` and verifies the new password.
4. Update `DATABASE_URL` in place. Do not rename a Sensitive variable (Vercel
   returns 400). Then clear `TARGET_DB_PASSWORD`.
5. Redeploy so runtime picks up the new URL. The migrate step succeeding is
   the check that it works.
6. Put the same password on Railway (`MYSQLPASSWORD` and
   `MYSQL_ROOT_PASSWORD`; rewrite `MYSQL_URL` / `MYSQL_PUBLIC_URL` if they
   are literal strings). Then DBeaver and Railway's Database tab work.

| | QA (done) | Prod (when asked) |
|---|---|---|
| Vercel project | `qa-ibudget` | `ibudget` |
| Public host | `junction.proxy.rlwy.net:29935` | `hayabusa.proxy.rlwy.net:47965` |
| User / database | `root` / `railway` | `root` / `railway` |

DBeaver: connection **Driver properties**, not Edit Driver. Set
`allowPublicKeyRetrieval=true` and `useSSL=true`. Paste the password from
the URL, not from Railway, until step 6 is done.
