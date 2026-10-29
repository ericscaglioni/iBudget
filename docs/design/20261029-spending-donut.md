# Spending categories as a donut

- Status: implemented
- Date: 2026-10-29
- Supercedes: none

## Request

Turn the dashboard's "Top spending categories" list into a pizza / pie that
fills up, so the share of this month's spending is obvious at a glance.

## Reasoning

The ranked list is good at "which is biggest?" and bad at "how much of the
month is this?" A ring that fills around a total answers the second question.
That is why Copilot, Monarch and bank apps use a donut here, not a bar of
names.

A filled pizza with labels on the slices is the version that fails: similar
slices look the same, labels collide on a phone, and you still need the
amounts. A **donut** (hole in the middle) plus a short legend keeps the fill
effect and the numbers.

## Questions

None — approved as written.

## Context from other apps

- **Copilot / Monarch / Mint:** donut of the month's spending, legend beside
  or below, total in the centre. Closest match.
- **YNAB:** reports are more bar / envelope. Not the model here.
- **Revolut / banks:** donut that draws on, with category colours.

## Plan

Approved 2026-10-29.

- Keep the same data: this month's category breakdown, already excluding
  transfers. Same card chrome as now (`rounded-lg border … shadow-sm`).
- A **donut** (Recharts `Pie`, inner radius) that animates from empty to
  filled when the month (or All vs a currency) changes. Slice colours are the
  category colours already stored. No extra brand colours. No labels on the
  slices.
- Legend next to it on desktop, under it on a phone: colour, name, amount,
  share. Use `ClientOnlyCurrency`.
- Top 5 + Other. Other uses a muted gray (`gray-300`), not a new brand
  colour.
- Centre of the donut: expenses total for the selected month.
- **Not in this version:** tapping a slice to filter transactions; a second
  chart for income; 3D or exploding slices.

## Risks and considerations

- Pies lie when slices are close in size. The legend amounts are the source
  of truth; the ring is the share.
- One dominant category (rent) will look like a full ring. That is honest.
- Animation must not snap (UI rule: height and this kind of reveal use
  motion). Respect `motion-reduce`.
- Do not format money in a new way; `ClientOnlyCurrency` (or the same helper
  the 6-month chart already uses) only.
- Category colours can clash or sit on white poorly. Keep a thin white gap
  between slices if Recharts allows it; do not rewrite the palette.

## Decision history

- 2026-10-29: proposed.
- 2026-10-29: approved (donut + legend, top 5 then Other, total in the hole).
- 2026-10-29: desktop splits the card in half (larger donut, legend on the
  other side). A tap shows the tooltip without a focus box.
- 2026-10-29: implemented in 1.2.0.
