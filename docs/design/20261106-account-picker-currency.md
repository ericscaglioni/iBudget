# Account picker shows the currency

- Status: implemented
- Date: 2026-11-06
- Supercedes: none

## Request

When picking an account on a transaction, it is hard to tell which one you
mean if they are named “N26” or “Wise” without the currency. Show the
currency so the user does not have to encode it in the name.

## Reasoning

iBudget is built for people who hold more than one currency. The dashboard
already speaks in `EUR` / `USD` chips. The account combobox already has
`currency` on each option and never shows it. Names like “N26” collide.

## Questions

None — approved as written.

## Context from other apps

- **Wise / Revolut:** currency-first pockets. Too loud for iBudget’s
  named accounts.
- **Copilot / Monarch:** name on the left, extra facts on the right,
  including a currency code for multi-currency people. Closest fit.
- **YNAB:** one currency per budget, so they skip this.
- Flags are noisy and wrong for EUR / CHF. iBudget already uses
  three-letter codes.

## Plan

- In the shared `Combobox` (desktop list, closed field, and the phone
  picker), show the account currency next to the name, quieter than the
  name (`N26` then `EUR`). Same codes as the dashboard chips.
- Show it only when the options include **more than one** currency.
  One-currency users see names only, same rule as From / To other
  currencies.
- Categories and other comboboxes are unchanged (they have no currency).
- Do not show balances, flags, or group the list under currency
  headings in this version.
- Filter by currency code as well as name, so typing `EUR` narrows the
  list.

## Risks and considerations

- Money, transfers, and how amounts count are unchanged.
- The closed desktop field is an `<input>`, so the selected value is
  plain text (`N26 · EUR`), not a styled chip.
- Account filters on the transactions list use the same kit, so they
  get the code too. That is consistent, not a one-off.

## Decision history

- 2026-11-06: proposed in chat (name + `EUR` when 2+ currencies).
- 2026-11-06: approved — implement as written.
- 2026-11-06: implemented (2.1.0).
