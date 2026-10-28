# Local users table

- Status: accepted
- Date: 2026-10-28
- Supercedes: none

## Context

Every money row stores a Clerk `userId` string, but nothing in MySQL names that
person. DBeaver cannot join accounts back to anyone. A 1.0.0 directory is
needed without putting name or email on any screen.

## Options

1. **Keep Clerk-only.** Inspect people in the Clerk dashboard. Cheap. Joins in
   the app database stay impossible.
2. **Local `users` table keyed by the Clerk id.** Store name and email, sync
   from Clerk, foreign-key the existing tables. Extra sync work. Makes the
   schema honest.
3. **A new internal user id.** Maps Clerk to a cuid. Cleaner isolation, but
   rewrites every existing `userId` and every query.

## Decision

Option 2. The Clerk user id is the primary key. Name and email are a copy for
joins and ops, not a second login system, and they are not shown in the app.

## Consequences

- `accounts`, `transactions`, `user_settings` and `user_guide` reference
  `users.id`. `categories.userId` is optional so the shared Transfer category
  can stay `NULL`.
- Foreign keys are `ON DELETE RESTRICT`. `deleteUserData` still deletes
  children first, then the `users` row.
- `user.created` / `user.updated` upsert name and email. Enable `user.updated`
  on the Clerk webhook if it is not already. Existing people are filled on
  deploy from Clerk (`scripts/initialize-existing-users.ts`). Rows that exist
  only in MySQL keep a null name and email rather than blocking the migration.
- Do not add a second user id. Do not render this table in the UI unless a
  later decision says so.
