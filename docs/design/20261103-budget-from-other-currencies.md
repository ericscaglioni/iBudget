# Plan money that arrives from (and leaves to) other currencies

- Status: implemented
- Date: 2026-11-03
- Supercedes: none

Adds a line to the Budget already described in
[20261030-monthly-budget](20261030-monthly-budget.md). That record stays
the category plan. This one is the gap: salary paid in USD, life spent
in EUR.

## Request

EUR "income" is often not an EUR salary. The job pays USD, then a
transfer lands euros. When planning EUR expenses for the month, the
spreadsheet also plans how many euros are expected to arrive, so it is
obvious whether EUR life can be covered. Without that number, the EUR
plan is expenses with no matching income.

Do not pretend the landing is an EUR Salary category. It is a
currency exchange. Give it its own expected line.

## Reasoning

Category expected vs actual only sees non-transfer income and
expenses. A USD→EUR transfer counts on the EUR dashboard as income
("received from currency exchange") and on USD as expense ("sent in
currency exchange"), and it is excluded from every category — budget
included.

So today you can plan USD Salary (that actual matches) and EUR rent
(that actual matches), but you cannot plan "euros I expect to convert
in." Putting €3,000 on EUR Salary leaves that row at actual €0
forever, while the EUR income card quietly includes the transfer.
That is how you fail to see whether EUR life is covered.

The honest object is the same figure the dashboard already isolates:
`incomeFromExchange` / `expensesFromExchange` per currency per month.
Plan those. Keep the job in USD. Keep EUR spend in EUR categories.

This stays in 2.0.0. It is not a new pillar; it is the spreadsheet
income line for people who earn in one currency and live in another.

## Questions

None — approved as written. Both lines: **From other currencies** and
**To other currencies**.

## Context from other apps

- **The spreadsheet (the request):** EUR expected income is "what I
  expect to have in euros," not "EUR-native salary transactions."
- **iBudget dashboard today:** already splits FX out of the category
  chart and captions it on the income / expenses cards. The budget
  should plan that caption, not invent a fake category.
- **Copilot / Monarch / YNAB:** none of them are this app's transfer
  model (two linked txs, All skips every transfer, one-currency view
  counts the FX). Do not copy their "transfer category" budgets.
- **Logging EUR income instead of a transfer:** balances would be
  wrong; All would double-count. Out of scope.

## Plan

One extra expected amount per month per currency, not a category.

### What it is

- **From other currencies** on the income list: expected vs actual
  `incomeFromExchange` for that month and currency.
- **To other currencies** on the expense list: expected vs actual
  `expensesFromExchange`.
- Same rules as category expected: a target, not a limit; empty or
  zero means unplanned, not a limit of 0; copy previous month copies
  these too; All is read-only.

### Where it shows

- Budget page, one-currency view: a row in Expected income /
  Expected expenses, not mixed into Salary or Rent. No category
  colour (this is not a category). Only when the user has accounts
  in more than one currency.
- Totals (expected income / expenses / net) include these amounts,
  matching the dashboard cards, which already include FX in actuals.
- Dashboard: `of €X expected` on Income includes "from other
  currencies." Same for Expenses if we plan the outgoing line.
- Do not put FX on the spending donut. The donut stays category
  spend; the caption on the expenses card is enough.
- All: **do not** add these expected amounts into All totals, and
  do not show the rows. All skips transfers, so the economic salary
  is already the USD income line converted at today's rate. Including
  the EUR landing as well would double-count. Stay on USD / EUR
  chips to plan FX.

### Form

- Category transactions: unchanged (remaining / over for that
  category).
- Cross-currency transfer: one quiet line for the **destination**
  currency ("€X left of €Y expected from other currencies"), and
  the same idea for the source if we plan outgoing. Never block
  save. Same-currency transfers: still no hint.

### Storage

- Not a `BudgetEntry` on a category (Transfer is the system
  category; plan lines must not hang off it).
- A small per-user / month / currency row for the two expected
  amounts (in / out). Zero or missing = unplanned. Delete with the
  user. Copy previous month copies the row. The migration runs on
  deploy.

### Explicitly not

- Treating FX as a user category, or as EUR Salary.
- Planning a currency the user does not hold.
- Using today's rate to guess how many euros a USD salary will
  become. They type the euro amount they expect to land, like the
  spreadsheet.
- Changing how transfers count on the dashboard or on All.
- Rollover, pace, envelopes (still not in 2.0.0).

## Risks and considerations

- **Double-count on All.** USD salary + EUR-from-FX expected would
  be two expecteds for one paycheck. All must ignore FX expected.
- **Income card vs only-expenses plan.** If they plan EUR expenses
  but not FX-in, do not show Income as `of €0.00 expected` while
  actual is the transfer. `expectedIncome` is null unless some
  income line (category or FX) is planned. Same for expenses.
- **Two currencies, one transfer.** Planning €3,000 in on EUR and
  $3,200 out on USD is two native numbers, not a rate. They can
  disagree with the market; that is the same honesty as the rest of
  per-currency planning.
- **Copy overwrite** already confirms; it must mention these lines
  too if they exist.
- **Transfers stay two linked txs.** Do not start booking salary
  as EUR income to make the old budget "work."
- Money still lives in a server service. Do not compute FX expected
  vs actual in the React tree.

## Decision history

- 2026-11-03: proposed — "From other currencies" (and, unless we
  drop it, "To other currencies") as plannable expected vs the
  dashboard's FX actuals; not a category; out of All totals.
- 2026-11-03: approved — both lines.
- 2026-11-03: only show / write these lines when the user holds more
  than one currency.
- 2026-11-03: implemented in 2.0.0.
