import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/errors/AppError";
import type { QueryParams } from "@/lib/utils/parse-query";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

import { prisma } from "@/lib/prisma";
import * as categories from "./categories";

const db = prisma as unknown as PrismaMock;
// No sort given: the service falls back to name, ascending
const queryParams = (overrides: Record<string, unknown> = {}) =>
  ({ page: 1, pageSize: 20, filters: {}, ...overrides }) as unknown as QueryParams;

describe("getCategoriesByUser", () => {
  it("lists the user's categories by name, and the total", async () => {
    db.category.findMany.mockResolvedValue([{ id: "c1" }]);
    db.category.count.mockResolvedValue(1);

    const result = await categories.getCategoriesByUser("u1", queryParams());

    expect(result).toEqual({ categories: [{ id: "c1" }], total: 1 });
    expect(db.category.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { name: "asc" },
      skip: 0,
      take: 20,
    });
  });

  it("filters by type and by (sanitized) name, and pages", async () => {
    await categories.getCategoriesByUser(
      "u1",
      queryParams({ page: 3, pageSize: 10, sortField: "type", sortOrder: "desc", filters: { type: "expense", name: "food%" } })
    );

    expect(db.category.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", type: "expense", name: { contains: "food" } },
      orderBy: { type: "desc" },
      skip: 20,
      take: 10,
    });
  });
});

describe("getUserCategories", () => {
  it("returns all of the user's categories by name", async () => {
    db.category.findMany.mockResolvedValue([{ id: "c1" }]);
    await expect(categories.getUserCategories("u1")).resolves.toEqual([{ id: "c1" }]);
    expect(db.category.findMany).toHaveBeenCalledWith({ where: { userId: "u1" }, orderBy: { name: "asc" } });
  });
});

describe("getSystemTransferCategory", () => {
  it("returns the shared Transfer category", async () => {
    db.category.findFirst.mockResolvedValue({ id: "t" });
    await expect(categories.getSystemTransferCategory()).resolves.toEqual({ id: "t" });
    expect(db.category.findFirst).toHaveBeenCalledWith({ where: { userId: null, name: "Transfer" } });
  });

  it("fails when it does not exist", async () => {
    db.category.findFirst.mockResolvedValue(null);
    await expect(categories.getSystemTransferCategory()).rejects.toThrow("Transfer category not found");
  });
});

describe("createCategory", () => {
  const data = { name: "Food", color: "#fff", type: "expense" } as never;

  it("creates the category for the user", async () => {
    db.category.create.mockResolvedValue({ id: "c1" });
    await expect(categories.createCategory("u1", data)).resolves.toEqual({ id: "c1" });
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      create: { id: "u1" },
      update: {},
    });
    expect(db.category.create).toHaveBeenCalledWith({ data: { userId: "u1", name: "Food", color: "#fff", type: "expense" } });
  });

  it.each([{ name: "" }, { color: "" }, { type: "" }])("needs a name, color and type (%o)", async (override) => {
    await expect(categories.createCategory("u1", { ...(data as object), ...override } as never)).rejects.toThrow("Missing required category data");
  });
});

describe("updateCategory", () => {
  it("updates the user's category", async () => {
    db.category.findUnique.mockResolvedValue({ id: "c1" });
    db.category.update.mockResolvedValue({ id: "c1", name: "New" });

    await categories.updateCategory("u1", "c1", { name: "New" });

    expect(db.category.findUnique).toHaveBeenCalledWith({ where: { id: "c1", userId: "u1" } });
    expect(db.category.update.mock.calls[0][0].where).toEqual({ id: "c1" });
  });

  it("fails when the category is not the user's", async () => {
    db.category.findUnique.mockResolvedValue(null);
    await expect(categories.updateCategory("u1", "c1", { name: "New" })).rejects.toThrow(NotFoundError);
    expect(db.category.update).not.toHaveBeenCalled();
  });
});

describe("deleteCategory", () => {
  it("deletes a category nothing uses", async () => {
    db.category.findUnique.mockResolvedValue({ id: "c1" });
    db.transaction.count.mockResolvedValue(0);
    await expect(categories.deleteCategory("u1", "c1")).resolves.toEqual({ message: "Category deleted successfully" });
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("keeps a category that has transactions", async () => {
    db.category.findUnique.mockResolvedValue({ id: "c1" });
    db.transaction.count.mockResolvedValue(2);
    await expect(categories.deleteCategory("u1", "c1")).rejects.toThrow("existing transactions");
    expect(db.category.delete).not.toHaveBeenCalled();
  });

  it("fails when the category is not the user's", async () => {
    db.category.findUnique.mockResolvedValue(null);
    await expect(categories.deleteCategory("u1", "c1")).rejects.toThrow(NotFoundError);
  });
});
