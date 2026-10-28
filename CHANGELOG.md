# Changelog

All notable changes to iBudget are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/). Git tags have no `v` prefix (e.g. `0.2.1`).

## [Unreleased]

### Added
- A `users` table that stores each person's Clerk id, name and email, so accounts and
  transactions can be joined back to someone in the database. It is not shown in the app.
  Existing people are filled in on deploy from Clerk; new sign-ups and profile changes stay
  in sync through the Clerk webhook. The migration runs on deploy.

## [0.4.3] - 2026-10-27

The production sign-in form loads.

### Fixed
- Signing in on production. The Clerk proxy was talking to a host that does not accept TLS, so the
  sign-in form never appeared.

## [0.4.2] - 2026-10-27

Production sign-in works again, and known dependency vulnerabilities are gone.

### Security
- Dependencies with known vulnerabilities were updated (Next.js, Zod, Vitest and their nested packages). `npm audit` is clean.

### Added
- Tests for the shared UI (buttons, dialogs, empty states, pagination, the getting-started guide).

### Fixed
- Signing in on production. Clerk serves its API through the app at `/__clerk` on `prod-ibudget.vercel.app`; those requests were being sent to the login page, so the sign-in form never loaded.

## [0.4.1] - 2026-10-27

Clearer errors, and the unused exchange-rate cache is gone.

### Fixed
- Deleting an account or category that still has transactions is refused with a clear error, instead
  of failing at the database.
- Requests to create or list accounts, categories or transactions without being signed in now answer
  401, instead of 500.
- Editing a transaction now returns the same error shape as the rest of the API, so a real reason
  (for example a missing amount received on a currency transfer) is shown instead of a generic failure.

### Changed
- Editing a transaction trims and validates the description the same way creating one does.

### Removed
- The unused exchange-rate cache (the dashboard shows one currency at a time, so nothing was reading
  or writing it). This drops the `exchange_rates` table.

## [0.4.0] - 2026-10-27

Currency exchanges on the dashboard, and easier lists and editing.

### Fixed
- The dashboard ignored transfers between accounts in different currencies. Since each currency is
  shown on its own, the money received now counts as income in the destination currency, and the
  money sent counts as an expense in the source currency, so each currency's income and expenses
  add up to its balance change. Transfers between accounts in the same currency are still left
  out, because it's the same money moving around. The "Transfer" category does not appear in the
  spending categories.

### Added
- The Income and Expenses cards on the dashboard say how much of the amount came from a currency
  exchange (for example "Includes R$520.00 received from currency exchange"), so it's clear it
  isn't earnings or spending.
- Lists (transactions, accounts, categories) have a "Rows per page" selector with 10, 20, 50 and
  100 rows. The choice is kept in the URL (`?pageSize=`), so it survives a refresh and can be shared,
  and it works together with the filters and sorting.
- The dashboard no longer shows every account at once. It shows one row (5 accounts on large
  screens, 3 on medium screens and on mobile) with a "Show all" button for the rest. "Show all" is
  only for the current visit and doesn't stick. The currency subtotal still counts every account.
- "Reorder" on the dashboard opens a window to put the accounts in the order you want, by dragging
  or with the arrows. The first accounts in your order are the ones shown. Accounts created later go
  to the end. This adds a `sortOrder` column to accounts (database migration).
- Collapsing and expanding on the dashboard (a currency's accounts, "Show all") is now animated
  smoothly instead of jumping.
- Editing a transfer shows a loading state while the received side is fetched, instead of an
  incomplete form. If it can't be loaded the modal closes with an error, rather than letting you save
  an incomplete transfer.
- Automated unit tests (`npm test`, with `npm run test:coverage`) for the services, API routes,
  validation and helpers.

### Changed
- The transaction window says "Edit Transaction" when you are editing one, instead of "New Transaction".
- Lists show 20 rows per page by default (it was 15). Only 10, 20, 50 and 100 are accepted in the
  URL; any other value falls back to 20.
- Changing a filter or the sorting goes back to the first page, instead of staying on a page that
  may no longer exist.

## [0.3.2] - 2026-10-25

Bug fix for editing transfers between accounts.

### Fixed
- Editing a transfer did not save the amount received when the accounts use different currencies,
  and it only updated one side of the transfer. Edits to the amounts, accounts, description and date
  now update both sides together, so account balances stay in sync.

## [0.3.1] - 2026-10-25

Bug fixes for creating and editing transactions.

### Fixed
- Creating a transaction removed characters from its description: `(`, `)`, `&`, `/`, `#`, `%`,
  `$` and accented letters such as é, ã or ñ were silently deleted, and the text was cut at 100
  characters. The description is now saved exactly as typed (up to 191 characters, the database
  limit, with a clear error beyond that). Descriptions saved before this fix stay as they were stored.
- Save stayed disabled when the only change was picking a different account, category, frequency
  (transactions and transfers) or an account's type or currency. Choosing from a dropdown now counts
  as a change, and clears the field's error once you pick a valid option.
- Save did nothing when editing a one-time transaction. It failed validation on the hidden
  recurring fields (frequency and end date, empty in the database), so the error had no field to show
  on. Those values are now loaded correctly, and any form that fails validation now shows a message
  instead of staying silent.

## [0.3.0] - 2026-10-22

Guidance for new users, so the app tells you what to do next.

### Added
- **Getting started checklist** on the dashboard: create an account, then add your first
  transaction. Steps tick themselves off, the next step has a button, and the checklist hides when
  done (or with **Hide** once you have an account).
- **Guided first account.** With no accounts, the dashboard shows only the checklist, and the
  floating **+** button and **+ New Transaction** send you to create an account first. After saving
  your first account you go straight into adding a transaction.
- **Empty states** on the Accounts, Transactions and Categories pages that explain what the page is
  for and offer the next step.
- **Multiple currencies tip:** when you have accounts in more than one currency and haven't chosen a
  default, the dashboard explains how to switch currency and links to Settings. It goes away once you
  save a default currency, or when you dismiss it.
- **Settings explains the default currency** when you only have one currency: it says what the
  dashboard is showing and that you can choose a default once you add an account in another currency,
  with a link to add one. It used to show a one-item dropdown with a disabled Save button.
- Short help text under the account form fields (type, currency, initial balance).
- A permanent **Create new account…** / **Create new category…** row at the bottom of those
  dropdowns in the transaction form (desktop and mobile). Before, it only appeared after typing a name.
- A tip with a **Choose default** button appears right after saving an account in a currency you
  didn't have before, wherever you add it, instead of only on the dashboard.
- Which tips you dismissed is stored per user and removed with the rest of your data on account
  deletion (new `user_guide` table).

### Security
- Rotated the QA and Prod database passwords after Railway's security incident of 2026-10-21, and
  added `scripts/rotate-db-password.sh` to rotate a MySQL password and close open connections without
  needing a redeploy on Railway.

## [0.2.1] - 2026-10-22

Bug fixes, security hardening and the first separate QA and Prod environments.

### Fixed
- The floating **+** button did nothing for users without an account or category, and its
  account/category lists were never refreshed after login. It now opens for everyone and reloads
  the lists each time the modal opens and when navigating. A failed load shows an error toast.
- **Save & add another** now keeps the category (as well as the type, date and account) and clears
  only the amount, description and the like. Combobox fields no longer show leftover typed text
  that looks selected when it isn't.
- The dashboard crashed with "Transfer category not found" on fresh databases. The default system
  categories (including Transfer) are now created by a migration.

### Security
- Removed the public `/api/users` endpoint. User setup now happens only in the signed Clerk
  webhook, and only `/login` and `/api/clerk` are public routes.
- Fixed the React Server Components vulnerabilities (CVEs).

### Changed
- Deleting a user in Clerk now removes all of their data (transactions, accounts, categories and
  settings). Before, only the categories were deleted.
- Migrations run only on Vercel builds (`vercel-build`) instead of on every `npm install`.
- QA (`develop`) and Prod (`main`) are now separate deployments with separate databases.

## [0.2.0] - 2026-10-19

### Added
- Transaction modal with a floating button, available from every page.
- **Save & add another** in the New Transaction modal, with a small spinner on the pressed button
  instead of a full-page overlay.
- Create accounts and categories inline from the transaction form.
- Settings page and a profile menu with Settings and Sign out.
- Default currency setting, an exchange rate cache and a wider currency list.
- Single-currency dashboard with a net worth card and a currency switcher.
- Transfers between accounts in different currencies require the received amount.
- Mobile-friendly option picker for comboboxes, with a create-new option.
- Close button on modals, and Esc closes the topmost modal or picker.

### Changed
- The delete confirmation has a red **Delete** button and a white **Cancel** button.
- The transaction form validates that the selected account and category exist.

### Fixed
- No more "HTML as JSON" error on the login page caused by fetching data while signed out.

## [0.1.0] - 2025-10-22

- Initial release.

[0.4.3]: https://github.com/ericscaglioni/iBudget/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/ericscaglioni/iBudget/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/ericscaglioni/iBudget/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/ericscaglioni/iBudget/compare/0.3.2...0.4.0
[0.3.2]: https://github.com/ericscaglioni/iBudget/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/ericscaglioni/iBudget/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/ericscaglioni/iBudget/compare/0.2.1...0.3.0
[0.2.1]: https://github.com/ericscaglioni/iBudget/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/ericscaglioni/iBudget/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/ericscaglioni/iBudget/releases/tag/0.1.0
