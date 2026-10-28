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

## Palette (`tailwind.config.js`)

Font is Inter.

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#10B981` | brand, primary buttons, focus |
| `primaryDark` | `#065F46` | dark green, sparingly |
| `accent` | `#6366F1` | indigo, sparingly (not for buttons) |
| `background` | `#F9FAFB` | page background |
| `slateDark` | `#1F2937` | dark text |
| `grayNeutral` | `#9CA3AF` | muted text |

Plus Tailwind grays for borders and surfaces (`gray-300`, `gray-50`, `white`).
Errors and destructive actions use `red-600`. Success uses `green-500`.

Do not introduce other brand colours (no stray `blue-*`, `purple-*`, and so on).

## Layout

- The site header (`Navbar`) is fixed to the top of the viewport (a spacer keeps
  the page from sliding under it). Do not invent a second top bar. Do not put
  `overflow-x-hidden` on `html`/`body` — use `overflow-x-clip` (hidden makes
  sticky/fixed headers fail).
- Match the spacing, radius (`rounded-md`) and shadows of the neighbouring cards and tables.
- Stack on mobile; follow the existing `md` / `xl` breakpoints (the dashboard grid is the reference: 1 column, then 3, then 5).
- List pagination stays on one row on a phone: rows-per-page on the left, arrows and "Page x of x" on the right (no Previous/Next words).
- Nothing should scroll sideways on a phone. Clip overflow on the overlay, not on the form itself, so the focus ring is not cut off. Fields use `min-w-0` so they shrink instead of pushing the page wider.
- Short dialogs (delete, confirm) are a centred card on a phone (`Modal`). Long forms use `fullScreenOnMobile` (`FormModal`). Comboboxes on a phone stay a button that opens the picker.
- In a modal with a long list, the list scrolls and the action footer stays visible (`ReorderAccountsModal` is the reference).
- Height changes must be animated. `Collapsible` exists for that; do not snap content in and out.

## Checklist

- [ ] Primary action is `Button variant="primary"`. Secondary is `outline` or `ghost`.
- [ ] No native `<select>`, no blue text-link standing in for a button.
- [ ] Colours come from the palette above.
- [ ] It works stacked on a phone and at `md` / `xl`, like the screens around it.
- [ ] Long lists in dialogs scroll; the footer does not disappear.
- [ ] Expanding and collapsing is smooth.
