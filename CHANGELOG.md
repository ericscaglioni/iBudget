# Changelog

All notable changes to iBudget are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/). Git tags have no `v` prefix (e.g. `0.2.1`).

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

[0.2.1]: https://github.com/ericscaglioni/iBudget/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/ericscaglioni/iBudget/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/ericscaglioni/iBudget/releases/tag/0.1.0
