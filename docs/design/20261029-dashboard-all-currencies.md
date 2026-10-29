# Unified dashboard view (All currencies)

- Status: implemented
- Date: 2026-10-29
- Supercedes: none

## Request

Expats (and anyone with accounts in more than one currency) want a single
dashboard picture: **All** — every account and the month's income / expenses /
net, converted into one currency. Today the dashboard is strictly one
currency at a time. Settings already pick a default currency for which of
those one-currency views opens first.

They also want **All** to be choosable as that default, which means we must
be explicit about **which currency All converts into**.

## Reasoning

The one-currency rule is right for checking a Brazilian account or a USD
salary. It is the wrong answer to "how am I doing overall?" That question
needs a converted total.

`user_settings.baseCurrency` was originally described as the currency used to
aggregate multi-currency data. After the unused `exchange_rates` table was
removed (0.4.1), it only means "which one-currency dashboard opens first."
The All view is bringing that original job back, so the setting should mean
**home currency** again: the unit All is expressed in.

A second, smaller choice is **what the dashboard opens on**: All (converted
to home), or a single held currency. Those are easy to mash into one
dropdown ("USD / BRL / All") and then have no answer for "All in what?"

## Questions

None — approved as written.

## Context from other apps

- **Copilot Money, Monarch, Lunch Money:** a home / display currency;
  everything on the dashboard is converted at market rates. Closest match.
- **YNAB:** one currency per budget. No All. You do not mix.
- **Revolut / Wise:** net worth in a display currency at live rates; the
  point is "what is this worth today."
- **Actual Budget / Firefly III:** conversion exists, but rates are stored
  (often user-entered). More control, more setup.
- **iBudget today:** matches YNAB's caution (never add BRL to USD). The
  All chip is the Copilot/Monarch path, as an *option*, not a replacement
  for the per-currency chips.

## Plan

Approved 2026-10-29.

- Keep the per-currency chips. Add **All** when the user holds more than
  one currency. The URL already owns the shown currency
  (`?currency=USD`); All uses `?view=all` so we do not pretend All is a
  currency code.
- **Home currency** is the existing default-currency setting, still only
  from currencies the user holds. All always converts into that. Settings
  copy becomes: this is the currency All is shown in.
- **Open dashboard on** — All, or home currency. Only shown when there
  are several currencies. That is how All becomes the default, without
  putting All in the home-currency picker.
- Near the dashboard chips, a **Tooltip** (info mark) explains that All
  converts to the home currency, that they can switch chips any time, and
  that Home currency / Open dashboard on live in Settings, with a link
  there. Be explicit: this is not locked to the landing choice.
- All converts **the whole dashboard**: net worth, accounts, monthly
  income / expenses / net, category chart, and the 6-month chart. Caption
  on the All view: "Converted to EUR · rates as of …". Per-currency chips
  stay native, unconverted.
- **Rates:** today's (latest daily) rate for every figure. A public API,
  fetched only from a **server service** (not from a React component, not
  from an API route that the browser calls for rates). Cache the day's
  rates. Do not ask the user to type rates in this version.
- **If the feed fails:** do not show All. Tell the user what happened
  (toast or a short banner). Fall back to the home-currency dashboard.
  If they had All as the landing choice, still open home until rates
  work again. The All chip is disabled, not hidden, so it is obvious
  why they cannot select it.
- **Accounts in All:** grouped by currency (the overview already groups;
  today it only receives one currency). Each card's headline amount is
  the converted home-currency figure; the native balance stays visible
  on the card. Reorder stays per currency, inside the group. No combined
  All `sortOrder`.
- **Transactions list** is unchanged. Totals stay native per currency.
- **Not in this version:** All on the transactions list; user-entered
  rates; converting to a currency the user does not hold; historical
  rates on each transaction's date.

### Transfers

Skip **every** transfer in All — same-currency and currency exchange —
the same way same-currency transfers are already invisible on a
one-currency dashboard.

A transfer is money they already have, moving wallets. Net worth in All
still sees it, because balances are converted. Monthly income / expenses
and the category chart should not. Converting both legs at *today's*
rate would invent an FX gain or loss that is not the `toAmount` they
typed and not the rate on the day they exchanged. That number would look
like income or spending and would be the wrong kind of wrong.

One-currency views keep today's rules (exchange counts as expense in the
source and income in the destination, out of the category chart). All
just does not put those legs into converted income / expenses. The
"includes X from currency exchange" note on the monthly cards is hidden
in All, or replaced by a short line that exchanges are not counted as
income or spending.

## Risks and considerations

- The product rule "the dashboard never mixes currencies" becomes:
  **never mix without converting, and never present a converted total as
  if it were native.** One-currency views stay untouched.
- Today's rate makes All move when the market moves, even if no
  transaction did. Correct for net worth; easy to misread for "this
  month's expenses." The caption has to say it.
- Caching rates is a database change; it runs on deploy. If the cache is
  empty and the feed fails, All cannot be honest — disable it and fall
  back, as above.
- Do not call the rates API from the browser. A dedicated server service
  keeps the key (if any), the cache, and the fallback in one place.
- Transaction-list totals in 1.1.0 stay native. Do not silently convert
  those figures.

## Decision history

- 2026-10-29: proposed.
- 2026-10-29: revised from chat — home currency stays a held currency;
  Open dashboard on is a second setting (several currencies only);
  tooltip + Settings link by the chips; convert the whole dashboard at
  today's public rate via a server service; API failure disables All and
  falls back to home; transactions list out of scope; accounts in All
  grouped by currency. Transfers in All skipped (both legs). Approved.
- 2026-10-29: implemented in 1.2.0.
