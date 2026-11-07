# v3 layout and light / dark theme

- Status: implemented
- Date: 2026-11-06
- Supercedes: none (visual language only; money rules stay)

## Request

Version 2 matches the spreadsheet: accounts, categories, transactions, a
dashboard, and a monthly plan. For v3, two visual upgrades:

1. Re-do the layout so the app feels more professional, without throwing
   away what already works.
2. A light theme and a dark theme, with a toggle.

Colours, type, and chrome are in scope. How money counts is not.
The login page is in the same visual language.

## Reasoning

The current look is a clear, consistent kit: Inter, Tailwind emerald
(`#10B981`), gray-50 pages, a fixed top bar, white cards. It reads as a
well-made web app. It does not yet read as a money product.

Two specific tells:

- **Brand green is the Tailwind starter green**, and it is also the colour
  of “good” money (primary buttons, extra income, bars). Finance apps
  usually keep brand quieter than income / expense.
- **Top navigation plus card-on-gray** is the default SaaS shell. Copilot,
  Monarch, and bank apps feel more like software you live in (sidebar or
  tabs, hairline borders, type that treats numbers as first-class).

Dark mode is a v3 feature of its own. It only looks professional if the
palette is tokens (paper, ink, brand, income, expense) rather than
`gray-50` inverted after the fact.

## Questions

None — approved as written.

1. **Layout:** app shell (sidebar on desktop; bottom tabs on a phone).
2. **Colour:** Forest ledger first (pine on warm paper; brand ≠ income).
3. **First visit:** light.
4. **Toggle:** Light / Dark / System (three-way).
5. **Where:** header, to the left of the user icon, sun / moon (and a
   system item in the menu).
6. **Persist:** on the user (`user_settings.theme`), not the browser.
7. **Login** uses the same Forest language (unsigned visitors stay
   light; after sign-in the saved preference applies).

## Context from other apps

- **Copilot Money:** dark-first, huge numbers, almost no brand colour.
  Green and red mean money, not the logo. iOS tabs. Too photographic
  for iBudget, but the “numbers first” lesson is right.
- **Monarch:** light, sage, **sidebar**. Closest “professional personal
  finance” shell. Dense dashboard. We should not copy the sage; we
  should copy the feeling of an app, not a marketing site with tables.
- **YNAB:** loud purple, colourful. Not the professional direction.
- **Wise:** green, but olive / lime, not Tailwind emerald. Consumer,
  not a ledger.
- **Mercury / Linear / Stripe dashboard:** hairline borders, near-black
  on off-white, one accent, tabular numbers. This is what people
  usually mean by “more professional.”
- **Theme toggles:** Linear, GitHub, Notion — Light / Dark / System in
  the account menu or settings. Copilot is dark-only. A three-way
  control avoids fighting the OS. Sun / moon in the header is the
  usual chrome.

## Plan

v3.0 is a **visual rewrite of the kit**, not new money behaviour.

- Semantic tokens (`paper`, `surface`, `ink`, `muted`, `line`, `brand`,
  `on-brand`, `income`, `expense`) with a light and a dark value.
  Forest ledger: pine `#1F6B4A` on warm paper `#F6F4F0`; income is a
  lighter green; expense is a brick red. Brand is not income.
- Tailwind `class` dark mode on `<html>`. A blocking script applies
  the saved theme before paint (no flash).
- App shell: desktop sidebar (all pages); phone bottom tabs
  (Dashboard, Transactions, Budget, More). More holds Accounts,
  Categories, Settings, Sign out. Slim header: theme control, then
  the user icon.
- Theme control: sun / moon button opening Light, Dark, System.
  Default for a new user is `light`. Changing it PATCHes `/api/settings`.
- Migration: `user_settings.theme` `VARCHAR(8)` NOT NULL DEFAULT
  `'light'` (`light` | `dark` | `system`). Runs on deploy.
- Clerk SignIn and toasts follow Forest. Login is always light
  (nobody is signed in yet).
- Type: keep Inter, tabular figures on money.
- Extra income stays “more than expected” in the **income** token,
  not brand. Do not change transfers, All, or budgets.

Out of scope: Ink and brass, zinc, new pages, a marketing site.

## Risks and considerations

- Money, currencies, and transfers do not change. A prettier bar must
  not recode overspend.
- Category colours are arbitrary hex. They stay; they must still read
  on both papers.
- `blue-100` on combobox focus and blue net-worth gradients go away.
- Ship as **3.0.0** because the visual language is the product surface.

## Decision history

- 2026-11-06: proposed — layout directions A/B/C, palettes Forest /
  Ink-brass / Zinc, and a Light / Dark / System toggle.
- 2026-11-07: approved — app shell, Forest ledger, first-time light,
  three-way toggle in the header (sun / moon, left of the avatar),
  persist on the user, login in the same language.
- 2026-11-07: implemented — 3.0.0.
