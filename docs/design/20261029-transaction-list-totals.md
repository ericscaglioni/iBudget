# Totals on the filtered transactions list

- Status: implemented
- Date: 2026-10-29
- Supercedes: none

## Request

Show income, expenses and net for the transactions currently on the list —
especially after filters — so someone looking at a period (or a category,
account, or search) does not have to add the rows up or go to the dashboard.

## Reasoning

The dashboard already answers “how did this month go?” for one currency. The
transactions page answers “which rows are these?” Pagination only reports how
many rows match. A user who filters October, or Groceries, or one account,
still has no total for *that* set.

That is a register question, not a dashboard question. The two screens should
keep different jobs.

## Questions

None — approved as written (chat, 2026-10-29: always-on strip, three figures,
per currency, dashboard transfer rules).

## Context from other apps

- **Copilot** and **Monarch** put a small income / spent / net summary on the
  transactions screen. It follows the active filters. Closest match.
- **Bank apps** often show “spent this period” on a statement, not a filterable
  register total.
- **YNAB** mostly does not total All Transactions. Totals live on the budget
  and on each account’s running balance. YNAB is budget-first; iBudget’s
  transactions page is a register, so a list total fits here.

A single unlabeled “Total” is uncommon and easy to misread (net vs expenses,
this page vs all matching rows, mixed currencies).

## Plan

- Always show a **summary card** between the filter chips and the table,
  titled “Totals for these filters”, so it is clear the figures follow the
  list, not the dashboard month. Income, Expenses, Net. Not dashboard colour
  cards. Not a single “Total”.
- Layout is a compact grid that *behaves* like a table (column headers,
  right-aligned amounts, `tabular-nums`) without looking like the
  transactions table: no row hover, no grid lines, no min-width that
  sideways-scrolls on a phone. One currency per row so USD and BRL line up.
- The figures are for **every matching row**, not the current page of 20.
- They follow the **same filters** as the list (month, type, category,
  account, description).
- **Never add two currencies together.** If the matching rows span more than
  one currency, show the user's default currency (or the first in the list)
  and a **View all** control. The rest expand with `Collapsible` and can be
  hidden again with **Show less**.
- **Transfers** use the same rules as the dashboard: same-currency transfers
  are not income or expense; a cross-currency transfer is an expense in the
  source currency and income in the destination.
- Hide the strip when there is nothing to add up (no matching amounts).
- Do not add charts, running balances, or “sum of selected rows” in this
  version.

## Risks and considerations

- Summing the visible table cells would be wrong: the list hides the incoming
  side of a transfer, paginates, and includes same-currency transfer rows
  that are not spending. Totals must be computed on the server from the
  filtered set, with both transfer sides available so currency exchanges can
  be classified.
- A type or category filter can legitimately drop one side of an exchange.
  The remaining side still counts in its own currency.
- Net is income minus expenses in that currency, not a converted grand total.
- The dashboard monthly summary stays the story of the month. This card must
  stay small so the two are not competing heroes.

## Decision history

- 2026-10-29: proposed in chat (always-on vs only-when-filtered; three
  figures vs one “Total”).
- 2026-10-29: approved as always-on, Income / Expenses / Net, per currency,
  dashboard transfer rules. Implementation follows in 1.1.0; status stays
  approved until that work is committed.
- 2026-10-29: presentation revised — the first strip felt lost, and several
  currencies did not line up (especially on a phone). Replace it with a
  labelled summary card and right-aligned columns.
- 2026-10-29: many currencies made the card too tall on a phone. Show one
  row by default; View all expands the rest as an accordion.
- 2026-10-29: keep the card full-width with right-aligned columns, but
  tighten padding. Large amounts truncate on a phone so the row does not wrap.
- 2026-10-29: implemented in 1.1.0.
