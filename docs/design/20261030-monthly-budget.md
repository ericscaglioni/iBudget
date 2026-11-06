# Monthly expected vs actual (budget)

- Status: implemented
- Date: 2026-10-30
- Supercedes: none

## Request

At the end of a month, plan the next one the way a spreadsheet already
works: write expected income, then go category by category for expected
expenses (usually by copying last month, because it barely changes).
Those numbers are **not** hard stops. They exist so it is obvious when
actual spending (or income) has gone past what was expected.

Then show expected vs actual on the dashboard. And, if it helps, a
nudge when logging a transaction.

This is v2.0.0: a new product pillar, not a tweak to lists.

## Reasoning

Today iBudget is a ledger with a dashboard. It answers "what happened?"
It does not answer "how am I doing against what I meant to do?" The
month-over-month % on expenses is explicitly *not* a target. A budget
is.

The spreadsheet ritual is the right shape for this app: one month at a
time, copy forward, inspect overspend. Other apps add progress bars,
copy-last-month, and (sometimes) a hint at entry time. YNAB's "give
every dollar a job" is a different product. iBudget should not become
that.

## Questions

None — approved as written.

## Context from other apps

- **The spreadsheet (the request):** expected income, then expected
  expenses per category; copy last month; overspend is information,
  not a wall.
- **Copilot Money:** optional category budgets, not envelopes. Bars
  go green / amber (pace) / red (already over). Copy and rollover
  exist. A "Budgets updates" notification fires **after** a category
  is over — not in the add-transaction sheet, and not as you approach
  the line.
- **Monarch:** flexible targets (and optional rollover / zero-based).
  "Budget Exceeded" is also **after** the fact. Closest cousin to the
  spreadsheet, with more knobs.
- **Mint (gone):** classic category limits, red when over. Soft in
  practice; you could still spend.
- **YNAB:** envelopes. You assign money you already have. Overspend
  is a problem to fix in the plan, not a "you spent more than you
  guessed." The add-transaction form does **not** reliably show
  remaining in the category picker (YNAB 4 did; nYNAB mostly does
  not). Manual-entry people keep asking for it.
- **PocketGuard / Simplifi / Rocket Money:** closer to "warn as you
  approach a limit." Useful when the bank feed is live. iBudget is
  typed in by hand, so the useful moment is **while saving the
  transaction**, not a push notification hours later.

**Do apps show something when registering a transaction?** Rarely
inside the form. The common pattern is: pick a category, save, and
later a notification or a red bar on the budget tab. For a
manual-entry app, a quiet line on the form ("€42 left of €200
expected in Groceries" / "€15 over expected") is the mix that fits
iBudget — information, never a blocked Save.

## Plan

Approved mix — spreadsheet ritual + Copilot/Monarch flex targets.
Not YNAB. Settled 2026-10-30: per-currency plans (All converts);
Budget page, dashboard expected vs actual, and the form hint all in
2.0.0; copy previous month (confirm before overwrite); every category
listed, unplanned spend is empty expected with actual; no rollover; no
pace; expected income per category.

### What a budget is

- A **month** + a **currency** + an **expected amount per category**
  (income categories and expense categories).
- Expected is a **target**, not a limit. Saving a transaction that
  goes past it always succeeds.
- Actuals use the same rules as the dashboard for that currency: the
  month's booked income / expenses, transfers skipped the same way,
  currency exchanges out of the category list. All converts expected
  and actual with the same today's-rate path as the rest of All.
- Empty expected (no row, or zero) means "not planned," not "limit
  of 0."

### Budget page (the spreadsheet)

- New nav item **Budget**, next to Categories.
- Same month control as the dashboard. Same currency chips + All.
- Two lists: expected income, then expected expenses. Each row:
  category colour, name, expected (editable), actual, and a short
  bar or remaining / over figure. Extra **income** (and from other
  currencies) is “more than expected” in the brand green — not red.
  Extra **expenses** (and to other currencies) stay red “over expected.”
- **Copy previous month** is the primary header action on every month,
  including the current one (day one, or any later day). It fills this
  month's expected amounts from the last month that has a plan (usually
  last month). Does not copy actuals. Does not invent categories the
  user no longer has. Disabled when there is no earlier plan. If this
  month already has expected amounts, confirm that they will be
  overridden.
- Totals at the top: expected income, expected expenses, expected
  net — next to actual income, actual expenses, actual net.

### Dashboard (expected vs actual)

- Income and Expenses cards: keep the actual as the big number; add
  a quieter "€X of €Y expected". Expenses past expected are over in
  red. Extra income is not an overspend. Net can show expected net
  the same way.
- The spending donut stays **actual** spend (share of the month).
  The legend can show expected next to actual, without turning the
  ring into a second chart.
- If the month has no plan at all, the dashboard stays as it is
  today (previous-month % on expenses, no expected line). Plan this
  month sits in the Monthly Summary heading (primary, full width on a
  phone). Once a plan exists, that same button is View plan.

### Transaction form

- After a category and an amount are chosen, one line of copy:
  remaining of expected, or how far over (expenses) / more than
  expected (income), for that category in the transaction's month and
  the account's currency. Keep a reserved line so the modal footer
  does not jump when the hint appears.
- Transfers: no budget line (they have no category in the plan).
- Do not toast on save. Do not refuse save. Do not add push
  notifications in this version.

### Explicitly not in 2.0.0

- YNAB "assign every dollar" / Ready to Assign / moving money
  between envelopes.
- Rollover of leftover or overspend.
- Pace / "you will go over by the 31st."
- Hard stops, merchant locks, or bank-feed alerts.
- Budgeting a currency the user does not hold.
- Splitting one transaction across several budget categories.
- Goals, sinking funds, annual / weekly budgets.

## Risks and considerations

- **Currency.** Planning BRL rent in BRL is honest. Showing that
  plan on All at *today's* rate has the same caveat as All expenses:
  the number moves with the market. Caption it. Do not mix native
  expected USD with native expected BRL.
- **Transfers** stay out of income, expenses, and the category plan,
  same as the dashboard and the donut.
- **Booked future dates** already count in the dashboard month. The
  budget for that month should count them too, or expected vs actual
  will disagree with the cards.
- Copy-last-month is a write. Confirm before overwriting a month
  that already has expected amounts.
- Categories can be renamed, retyped, or deleted. A plan line
  belongs to a `categoryId`. Deleting a category with a plan needs
  the same care as deleting one with transactions (refuse, or drop
  the plan lines — decide at implementation; refuse is safer).
- The dashboard % vs last month is *not* a target. Once expected
  exists, that line is the target. Keep both only if they do not
  read as the same thing; prefer expected when a plan exists.
- This is a database change (plan rows per user / month / currency /
  category). The migration runs on deploy.
- Do not compute money in the React tree. A server service owns
  expected vs actual; routes stay thin.

## Decision history

- 2026-10-30: proposed — spreadsheet copy-forward + Copilot/Monarch
  soft targets; Budget page; dashboard expected vs actual; optional
  form hint. Not YNAB.
- 2026-10-30: approved as written (per-currency plans, dashboard and
  form hint in 2.0.0, copy with confirm, all categories listed, no
  rollover or pace).
- 2026-11-02: copy is primary and always on the header, including
  the current month; confirm that an existing plan will be overridden;
  dashboard Plan this month / View plan sits in the Monthly Summary
  heading (full width on a phone); form hint keeps a reserved line so
  the modal does not leap.
- 2026-11-06: extra income is not red. Red is for spending past the
  plan only.
