# Calendar dates and looking ahead on the dashboard

- Status: accepted
- Date: 2026-10-28
- Supercedes: none

## Context

A transaction date is the day the user picked, not a timestamp. Saving
"1 November" from a browser in UTC+1 used to store 31 October 23:00 UTC, so
the October filter still listed it. Editing to 2 November moved it because
that local midnight falls on 1 November UTC.

Separately, people book income and expenses ahead of time. The dashboard
stopped at the current month, so those rows existed on the transactions page
but not in the monthly summary. Other apps (YNAB, Monarch, Copilot) let you
look at future months; balances stay "as of today." Mint-style "Upcoming"
lists are a different product.

## Options

1. **Store local midnight.** Matches the browser clock. The UTC server then
   groups the 1st of the month with the previous month for anyone east of UTC.
2. **Store UTC midnight for the calendar day.** The day the user typed is the
   day every filter and label uses. Existing shifted rows stay wrong until
   they are saved again.
3. **Dashboard: always allow next month, empty or not.** Easy to wander into
   unused future months.
4. **Dashboard: allow next month only through the latest booked transaction.**
   Planned months are reachable; empty ones are not. Refresh after save picks
   up a newly booked future month.

## Decision

Transaction dates are calendar days stored as UTC midnight. The dashboard
monthly summary can move forward until the newest month that already has a
transaction. Account balances keep ignoring future dates.

## Consequences

- Forms send `YYYY-MM-DD`. Services call `parseCalendarDate`. Month ranges
  come from `getMonthDateRange`. Display uses UTC (`formatDate`,
  `calendarDateString`).
- Do not turn a date input into `dayjs(value).toDate()` on the client.
- Rows saved before this change (local midnight) need an edit and save to
  land in the right month.
- Empty future months are not navigable until something is booked there.
- The six-month chart is the six months ending at the latest booked month
  when that is in the future, otherwise the trailing six through today.
