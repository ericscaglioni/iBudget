import { dayjs } from "./dayjs";

export const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(value);
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * A transaction date is a calendar day, not a time. Stored as UTC midnight so
 * "1 November" stays November in every timezone (the server is UTC; the browser is not).
 */
export const parseCalendarDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new RangeError("Invalid date");
    }
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    throw new RangeError("Invalid date");
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

export const calendarDateString = (value: string | Date): string => {
  const date = parseCalendarDate(value);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
};

export const calendarMonthString = (value: string | Date): string => calendarDateString(value).slice(0, 7);

export const formatDate = (date: string | Date) => {
  return dayjs.utc(parseCalendarDate(date)).format("LL");
};

/**
 * Get the start and end instants for a given month in YYYY-MM format, in UTC.
 */
export const getMonthDateRange = (monthString: string): { startDate: Date; endDate: Date } | null => {
  const [year, month] = monthString.split('-').map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return null;
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return { startDate, endDate };
};

/** UTC dayjs for a YYYY-MM month. Does not use dayjs custom parse (that plugin is not loaded). */
export const parseYearMonth = (monthString: string) => {
  const range = getMonthDateRange(monthString);
  if (!range) return null;
  return dayjs.utc(range.startDate);
};

export const shiftCalendarMonth = (monthString: string, months: number) => {
  const parsed = parseYearMonth(monthString);
  if (!parsed) return monthString;
  return parsed.add(months, "month").format("YYYY-MM");
};

/** Short or long month label from YYYY-MM (e.g. "Oct 2026" / "October 2026"). */
export const formatMonthYear = (monthString: string, long = false) => {
  const parsed = parseYearMonth(monthString);
  if (!parsed) return monthString;
  return parsed.format(long ? "MMMM YYYY" : "MMM YYYY");
};
