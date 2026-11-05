# Hand cursor on tables

- Status: implemented
- Date: 2026-11-03
- Supercedes: none

## Request

When the mouse is over a table, show the hand cursor instead of the default
arrow. Click a row to edit it.

## Reasoning

List rows already highlight on hover (Accounts, Categories, Transactions),
and the actions on those rows are meant to be used. The arrow cursor makes
them look like static text. A hand is the usual “you can click this” cue.
A single click matches that cue: Copilot, Monarch, and bank apps open the
record on one tap. Double-click is a desktop habit, easy to miss, and
almost useless on a phone.

## Questions

None — approved as written.

1. **Which tables?** Shared lists only: Accounts, Categories, Transactions.
   Not Budget, not the transaction totals summary.
2. **Whole row, or only the clickable bits?** Whole data row, matching the
   hover highlight. Click opens edit. Edit / Delete stay on the row.

## Context from other apps

- **Copilot Money / Monarch / most bank apps:** pointer on a row that
  opens the transaction (or account). The row is the control. One click
  / tap.
- **Spreadsheets (Google Sheets, Excel):** cell cursor, not a hand —
  those grids are for selecting cells, not opening a record.
- iBudget lists are the first kind. Copy an amount from the edit modal
  if needed; the row is not a spreadsheet cell.

## Plan

- Put `cursor-pointer` on **data rows** of the shared `Table` when the
  list can be edited (Accounts, Categories, Transactions).
- Click a row to open the same edit modal as the Edit button. Ignore
  the click when it lands on Edit / Delete so those buttons keep their
  own click (Delete must not also open edit).
- Sortable column headers already are buttons; give those the hand too.
- Do **not** change pagination, filters, the empty “No data” line, or
  disabled controls.
- Do **not** change Budget or transaction totals.
- One callback on the kit (`onRowClick`), not a one-off per page.
- Edit / Delete remain, including for keyboard and touch.

## Risks and considerations

- Click-to-edit makes selecting text in the row awkward. That is
  accepted; copy from the modal. Do not go back to double-click to
  “fix” copy-and-paste.
- Money, currencies, and transfers are unchanged.

## Decision history

- 2026-11-03: proposed.
- 2026-11-03: approved — shared lists only; whole row; double-click to
  edit.
- 2026-11-03: revised — click the row to edit. Double-click was not
  discoverable, and the hand cursor already promised a single click.
- 2026-11-03: implemented in 2.0.0.
