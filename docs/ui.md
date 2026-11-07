# UI and theme

Every screen should look like it belongs in iBudget. Before adding UI, find the
closest existing page or component and copy its look. Do not invent a new visual
language (default blue links, native selects, ad hoc buttons).

Components live in `@/components/ui`. Import from there. If something is missing,
extend that kit instead of styling a one-off.

## What to use

| Need | Use | Not |
|------|-----|-----|
| Any button or button-like action | `Button` | `<button className="text-blue-600">` or a styled `<a>` |
| Dropdown / selector | `Combobox` (`FormCombobox` in forms) | native `<select>` |
| Month | `MonthYearPicker` | a free-text date or native month input |
| Text field | `Input` / `FormTextInput` | a raw `<input>` with new styles |
| Field label | `FieldLabel` (`required` for the asterisk) | a homemade `*` on the label |
| Choice of a few options | `RadioGroup` / `FormRadioGroup` / `SegmentedControl` | a row of custom chips |
| Dialog | `Modal`, `FormModal`, `ConfirmationModal`, `DeleteModal` | a homemade overlay |
| Icons | `Icon` (add a name in `Icon.tsx` if missing) | importing Heroicons in the page |
| Loading | `Spinner`, `LoadingOverlay`, or `Button isLoading` | a custom spinner or plain "Loading..." |
| Expand / collapse | `Collapsible` | toggling `hidden` (the content jumps) |
| Empty list | `EmptyState` | a centred paragraph |
| Feedback | `showSuccess` / `showError` / `showInfo` from `@/lib/utils/toast` | `alert()` or a new toast style |
| Short explanation on a figure | `Tooltip` | a native `title` or a one-off popover |
| Money | `ClientOnlyCurrency` | formatting currency in a way that mismatches the rest |

### `Button` variants

- `primary` — the one action the user is here to do (Save, New Account).
- `outline` — a secondary action that still looks like a control (Cancel, Reorder, Show all).
- `ghost` — a quiet action in a toolbar or table row (edit, previous/next page).
- `danger` — destructive confirmations only (Delete).

Sizes are `sm` / `md` / `lg`. Focus rings are already `focus:ring-primary/50`.

## Palette (`tailwind.config.js` + `globals.css`)

Font is Inter. Money uses tabular figures. The palette is **Forest ledger**:
pine on warm paper. Brand is not the same colour as income.

Tokens have a light and a dark value. Use them (`bg-paper`, `text-ink`,
`border-line`, `text-income`) — do not reach for `gray-*`, `green-*`,
`blue-*`, or `white`. Tailwind `dark:` is driven by a `dark` class on
`<html>`, not `prefers-color-scheme` alone.

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `paper` | `#F6F4F0` | `#121614` | page background |
| `surface` | `#FFFFFF` | `#1C211E` | cards, header, sidebar |
| `ink` | `#1A1F1C` | `#EEF1EE` | body text |
| `muted` | `#6B726E` | `#9AA39C` | secondary text |
| `line` | `#E6E2DB` | `#2A322E` | hairline borders |
| `brand` | `#1F6B4A` | `#3D9B6E` | logo, primary buttons, focus |
| `on-brand` | `#F6F4F0` | `#121614` | text on brand / expense buttons |
| `income` | `#2F9E6B` | `#4ABA7A` | money in, extra income |
| `expense` | `#C2413B` | `#E06A64` | money out, overspend, danger |

`primary`, `background`, `slateDark`, and `grayNeutral` still exist as
aliases of brand / paper / ink / muted. Prefer the new names.

Do not introduce other brand colours (no stray `blue-*`, candy emerald, gradients).

Theme: Light / Dark / System, in the header next to the user icon (sun /
moon). Saved on the user (`user_settings.theme`). New users start on light.
Clerk SignIn uses Forest tokens (`rgb(var(--surface))` and friends) so the
card, including the footer, matches the page in both themes.

## Layout

- App shell: a **sidebar** on desktop (`md+`) with every page plus Settings;
  a slim header (theme control, then the user icon); **bottom tabs** on a
  phone (Dashboard, Transactions, Budget, More). More holds Accounts,
  Categories, Settings, Sign out. Do not put `overflow-x-hidden` on
  `html`/`body` (hidden makes sticky/fixed headers fail). Clip overflow-x
  on `html` only — clip on both makes opening a header menu add a nested
  scrollbar. Login has no shell. On a phone the copy and SignIn pack from
  the top (not a centred stack or a stretched lower pane). Sidebar Settings uses the same full-width
  link as the other items. Phone tabs are at least as tall as the header
  (`min-h-14`). Opening More lifts the page and the new-transaction button
  above the sheet.
- The site footer (`AppFooter`) shows `iBudget` and the version from
  `package.json`. Do not hard-code a version number. Hide it on `/login`, like
  the navbar.
- Match the spacing, radius (`rounded-md`) and shadows of the neighbouring cards and tables.
- Stack on mobile; follow the existing `md` / `xl` breakpoints (the dashboard grid is the reference: 1 column, then 3, then 5).
- List pagination stays on one row on a phone: rows-per-page on the left, arrows and "Page x of x" on the right (no Previous/Next words).
- Shared list tables (Accounts, Categories, Transactions) show a hand cursor
  on data rows. Click a row to edit; Edit / Delete stay on the row. Budget
  and the transaction totals summary do not.
- Filtering, sorting or paging a list shows a loading overlay on the table
  rows (not the filters or the rest of the page) until the new rows arrive.
- Active list filters show as dismissible pills under the filter controls,
  with a "Clear filters" action. Use `ActiveFilters`; do not restyle the
  coloured category `Chip` for this.
- The transactions list has a small “Totals for these filters” summary
  (`TransactionTotals`): a labelled card with right-aligned Income / Expenses
  / Net. One currency is visible; extra currencies expand with `Collapsible`
  via View all. Do not turn it into dashboard colour cards, the transactions
  `Table`, or add currencies together.
- The dashboard can show **All**: every figure converted into the home
  currency, with per-currency chips still native. A Tooltip next to the chips
  explains All and links to Settings. Do not mix native amounts. If rates
  fail, All is disabled and a banner explains the fallback.
- This month's spending is a donut (`TopSpendingCategories`) with a legend
  (name, amount, %). Top 5 then Other.   Do not label slices or invent extra
  brand colours; Other is muted stone, not brand. Respect `prefers-reduced-motion`.
  When a budget exists, the legend shows expected next to actual: actual is
  ink and semibold, expected is smaller muted type.
- The six-month trend ends at the current month (this month on the right).
  Do not slide it to a later booked month. The monthly summary still can.
- The Budget page is a month of expected vs actual, income then expenses,
  with the same currency chips as the dashboard. Expected is an editable
  amount, not a lock. Income includes **From other currencies**; expenses
  include **To other currencies** — not category rows, no category colour.
  Those rows are hidden on All, and when the user only has one currency.
  Copy previous month is the primary header action on every month,
  including the current one; it confirms before overwrite. All is
  read-only (switch to a currency to edit). Extra income is “more
  than expected” in primary green, not red; extra expenses stay red
  “over expected.”
- On the dashboard, Plan this month (or View plan) sits in the Monthly
  Summary heading. Full width on a phone; next to the title from `md` up.
- Nothing should scroll sideways on a phone. Clip overflow on the overlay, not on the form itself, so the focus ring is not cut off. Fields use `min-w-0` so they shrink instead of pushing the page wider.
- Short dialogs (delete, confirm) are a centred card on a phone (`Modal`). Long forms use `fullScreenOnMobile` (`FormModal`). Comboboxes on a phone stay a button that opens the picker. Account options show the currency code next to the name when the list has more than one currency (closed field and list). Categories and one-currency users see names only. Do not add flags, balances, or group the list by currency.
- In a modal with a long list, the list scrolls and the action footer stays visible (`ReorderAccountsModal` is the reference).
- Height changes must be animated. `Collapsible` exists for that; do not snap content in and out.
- Required fields in form modals show an asterisk on the label (`required` on
  `FormTextInput` / `FormCombobox` / `FormRadioGroup` / `ColorInput`). Do not
  invent a different required marker.

## Checklist

- [ ] Primary action is `Button variant="primary"`. Secondary is `outline` or `ghost`.
- [ ] No native `<select>`, no blue text-link standing in for a button.
- [ ] Colours come from the Forest tokens above (including dark).
- [ ] It works stacked on a phone and at `md` / `xl`, like the screens around it.
- [ ] Long lists in dialogs scroll; the footer does not disappear.
- [ ] Expanding and collapsing is smooth.
- [ ] Required fields in a form modal have an asterisk.
