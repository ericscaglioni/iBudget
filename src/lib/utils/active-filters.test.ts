import { describe, expect, it } from "vitest";
import { getActiveFilterItems, stripFilterParams } from "./active-filters";

const filters = [
  { name: "type", type: "segmentedControl", label: "Type", options: [{ label: "Expense", value: "expense" }] },
  { name: "month", type: "monthYear", label: "Month" },
  { name: "description", type: "text", label: "Description" },
];

describe("getActiveFilterItems", () => {
  it("skips empty values and uses option labels", () => {
    expect(getActiveFilterItems(filters, new URLSearchParams("page=2"))).toEqual([]);
    expect(getActiveFilterItems(filters, new URLSearchParams("type=expense"))).toEqual([
      { name: "type", label: "Type", display: "Expense" },
    ]);
  });

  it("formats a month and keeps free-text as typed", () => {
    const items = getActiveFilterItems(
      filters,
      new URLSearchParams("month=2026-10&description=rent")
    );
    expect(items).toEqual([
      { name: "month", label: "Month", display: expect.stringMatching(/October/) },
      { name: "description", label: "Description", display: "rent" },
    ]);
  });
});

describe("stripFilterParams", () => {
  it("keeps how the list is shown and drops what narrowed it", () => {
    const next = stripFilterParams(
      new URLSearchParams("type=expense&page=3&pageSize=50&sortField=date&sortOrder=asc")
    );
    expect(next.get("type")).toBeNull();
    expect(next.get("page")).toBeNull();
    expect(next.get("pageSize")).toBe("50");
    expect(next.get("sortField")).toBe("date");
    expect(next.get("sortOrder")).toBe("asc");
  });
});
