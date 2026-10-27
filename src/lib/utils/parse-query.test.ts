import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { parseQueryParams } from "./parse-query";

describe("parseQueryParams", () => {
  it("falls back to the defaults", async () => {
    expect(await parseQueryParams({})).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sortField: "createdAt",
      sortOrder: "desc",
      filters: {},
    });
  });

  it("reads page, page size and sorting", async () => {
    const result = await parseQueryParams({ page: "3", pageSize: "50", sortField: "name", sortOrder: "asc" });
    expect(result).toMatchObject({ page: 3, pageSize: 50, sortField: "name", sortOrder: "asc" });
  });

  it.each(["10", "20", "50", "100"])("accepts the page size %s", async (size) => {
    expect((await parseQueryParams({ pageSize: size })).pageSize).toBe(Number(size));
  });

  it.each(["15", "0", "-5", "100000", "abc", "", "1.5"])("falls back to the default for the page size %j", async (size) => {
    expect((await parseQueryParams({ pageSize: size })).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it("ignores a page size that is repeated or missing", async () => {
    expect((await parseQueryParams({ pageSize: ["10", "50"] })).pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect((await parseQueryParams({ pageSize: undefined })).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it.each(["0", "-2", "abc", ""])("falls back to page 1 for the page %j", async (page) => {
    expect((await parseQueryParams({ page })).page).toBe(1);
  });

  it("only sorts ascending when asked to", async () => {
    expect((await parseQueryParams({ sortOrder: "asc" })).sortOrder).toBe("asc");
    expect((await parseQueryParams({ sortOrder: "desc" })).sortOrder).toBe("desc");
    expect((await parseQueryParams({ sortOrder: "sideways" })).sortOrder).toBe("desc");
  });

  it("treats every other parameter as a filter, and not page or page size", async () => {
    const { filters } = await parseQueryParams({ page: "2", pageSize: "50", type: "income", month: "2026-10" });
    expect(filters).toEqual({ type: "income", month: "2026-10" });
  });
});
