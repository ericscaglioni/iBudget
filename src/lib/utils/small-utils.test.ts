import { describe, expect, it } from "vitest";
import { hasActiveFilters } from "./has-active-filters";
import { moveItem } from "./move-item";
import { sortAccountsByUserOrder } from "./sort-accounts";
import { ClientDecimal, toNumber } from "./decimal";
import { getBaseUrl } from "./url";
import { formatCurrency, formatDate, formatMonthYear, getMonthDateRange, parseCalendarDate, parseYearMonth, shiftCalendarMonth } from "./format";
import { cycleSortParams } from "./cycle-sort";

describe("moveItem", () => {
  it("moves an item forward and back", () => {
    expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    expect(moveItem([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
  });

  it("does not change the list it was given", () => {
    const list = [1, 2, 3];
    moveItem(list, 0, 2);
    expect(list).toEqual([1, 2, 3]);
  });

  it("returns the same list for moves that do nothing", () => {
    const list = [1, 2, 3];
    expect(moveItem(list, 1, 1)).toBe(list);
    expect(moveItem(list, 0, 5)).toBe(list);
    expect(moveItem(list, -1, 1)).toBe(list);
    expect(moveItem(list, 5, 0)).toBe(list);
    expect(moveItem(list, 0, -1)).toBe(list);
  });
});

describe("sortAccountsByUserOrder", () => {
  const names = (list: { name: string; sortOrder: number | null }[]) => sortAccountsByUserOrder(list).map((a) => a.name);

  it("puts the ordered accounts first, in their order", () => {
    expect(names([
      { name: "c", sortOrder: 2 },
      { name: "a", sortOrder: 0 },
      { name: "b", sortOrder: 1 },
    ])).toEqual(["a", "b", "c"]);
  });

  it("puts never-ordered accounts after, alphabetically", () => {
    expect(names([
      { name: "z", sortOrder: null },
      { name: "b", sortOrder: 1 },
      { name: "a", sortOrder: null },
      { name: "c", sortOrder: 0 },
    ])).toEqual(["c", "b", "a", "z"]);
  });

  it("sorts by name when nothing is ordered or positions tie", () => {
    expect(names([{ name: "b", sortOrder: null }, { name: "a", sortOrder: null }])).toEqual(["a", "b"]);
    expect(names([{ name: "b", sortOrder: 0 }, { name: "a", sortOrder: 0 }])).toEqual(["a", "b"]);
  });

  it("does not change the list it was given", () => {
    const list = [{ name: "b", sortOrder: null }, { name: "a", sortOrder: null }];
    sortAccountsByUserOrder(list);
    expect(list.map((a) => a.name)).toEqual(["b", "a"]);
  });
});

describe("cycleSortParams", () => {
  it("goes ascending, then descending, then back to unsorted", () => {
    const first = cycleSortParams(new URLSearchParams("page=2"), "date");
    expect(first.get("sortField")).toBe("date");
    expect(first.get("sortOrder")).toBe("asc");
    expect(first.get("page")).toBeNull();

    const second = cycleSortParams(first, "date");
    expect(second.get("sortOrder")).toBe("desc");

    const third = cycleSortParams(second, "date");
    expect(third.get("sortField")).toBeNull();
    expect(third.get("sortOrder")).toBeNull();
  });

  it("starts a different column at ascending", () => {
    const next = cycleSortParams(new URLSearchParams("sortField=amount&sortOrder=desc"), "date");
    expect(next.get("sortField")).toBe("date");
    expect(next.get("sortOrder")).toBe("asc");
  });
});

describe("hasActiveFilters", () => {
  it("ignores the parameters that only change how a list is shown", () => {
    expect(hasActiveFilters(new URLSearchParams("page=2&pageSize=50&sortField=date&sortOrder=asc&new=1"))).toBe(false);
    expect(hasActiveFilters(new URLSearchParams(""))).toBe(false);
  });

  it("is true as soon as something narrows the list down", () => {
    expect(hasActiveFilters(new URLSearchParams("page=2&type=income"))).toBe(true);
  });
});

describe("decimal helpers", () => {
  it("ClientDecimal wraps numbers and numeric strings", () => {
    expect(new ClientDecimal(12.5).toNumber()).toBe(12.5);
    expect(new ClientDecimal("12.5").toNumber()).toBe(12.5);
    expect(new ClientDecimal("12.5").toString()).toBe("12.5");
    expect(ClientDecimal.fromNumber(3).toNumber()).toBe(3);
  });

  it("toNumber accepts numbers, strings and Decimal-like values", () => {
    expect(toNumber(5)).toBe(5);
    expect(toNumber("7.25")).toBe(7.25);
    expect(toNumber({ toNumber: () => 9 })).toBe(9);
    expect(toNumber(null as unknown as number)).toBe(0);
  });
});

describe("getBaseUrl", () => {
  it("uses the configured URL on the server, or localhost", () => {
    const original = process.env.NEXT_PUBLIC_BASE_URL;
    process.env.NEXT_PUBLIC_BASE_URL = "https://ibudget.example";
    expect(getBaseUrl()).toBe("https://ibudget.example");
    delete process.env.NEXT_PUBLIC_BASE_URL;
    expect(getBaseUrl()).toBe("http://localhost:3000");
    if (original !== undefined) process.env.NEXT_PUBLIC_BASE_URL = original;
  });

  it("uses relative URLs in the browser", () => {
    (globalThis as { window?: unknown }).window = {};
    try {
      expect(getBaseUrl()).toBe("");
    } finally {
      delete (globalThis as { window?: unknown }).window;
    }
  });
});

describe("format helpers", () => {
  it("formats a currency amount", () => {
    expect(formatCurrency(1234.5, "USD")).toBe(new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(1234.5));
  });

  it("formats a date with the localized long format", () => {
    expect(formatDate("2026-10-25")).toContain("2026");
    expect(formatDate("2026-10-25")).toMatch(/Oct/);
  });

  it("formats a YYYY-MM month without producing Invalid Date", () => {
    expect(formatMonthYear("2026-10")).toMatch(/Oct/);
    expect(formatMonthYear("2026-10")).toContain("2026");
    expect(formatMonthYear("2026-10", true)).toMatch(/October/);
    expect(formatMonthYear("2026-10")).not.toMatch(/Invalid Date/i);
    expect(formatMonthYear("nope")).toBe("nope");
    expect(parseYearMonth("2026-10")?.format("YYYY-MM")).toBe("2026-10");
    expect(parseYearMonth("nope")).toBeNull();
    expect(shiftCalendarMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftCalendarMonth("2026-01", -1)).toBe("2025-12");
  });

  it("gives the first and last UTC moment of a month", () => {
    const range = getMonthDateRange("2026-02")!;
    expect(range.startDate.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(range.endDate.toISOString()).toBe("2026-02-28T23:59:59.999Z");
    expect(getMonthDateRange("2028-02")!.endDate.getUTCDate()).toBe(29);
  });

  it("keeps 1 November in November, even when local midnight would be October in UTC", () => {
    const firstOfNovember = parseCalendarDate("2026-11-01");
    const october = getMonthDateRange("2026-10")!;
    const november = getMonthDateRange("2026-11")!;
    expect(firstOfNovember.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(firstOfNovember >= october.startDate && firstOfNovember <= october.endDate).toBe(false);
    expect(firstOfNovember >= november.startDate && firstOfNovember <= november.endDate).toBe(true);
  });

  it.each(["", "2026", "2026-13", "2026-00", "abc-10", "-5-3"])("returns null for the month %j", (value) => {
    expect(getMonthDateRange(value)).toBeNull();
  });
});
