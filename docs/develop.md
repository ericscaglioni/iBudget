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
| `npm run build` | `prisma generate && next build` (no migrate) |
| `npm run vercel-build` | `prisma migrate deploy && prisma generate && next build` — this is what Vercel runs, so a new migration is applied on QA (branch `develop`) then Prod (branch `main`) |

## Tests

- Files sit next to the code: `foo.test.ts` beside `foo.ts`.
- Prisma is mocked (`src/test/mock-prisma.ts`). Tests must not need a database.
- Coverage is measured on `src/lib`, `src/app/api` and Zod `schema.ts` files.
  React pages, hooks and providers are not in the 85% gate.
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
