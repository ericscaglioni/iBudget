import { describe, expect, it, vi } from "vitest";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

import { prisma } from "@/lib/prisma";
import { deleteUserData, initializeUserDefaults } from "./initializeUserDefaults";

const db = prisma as unknown as PrismaMock;

describe("initializeUserDefaults", () => {
  it("gives a new user their own copy of the default categories, except Transfer", async () => {
    db.category.findFirst.mockResolvedValue(null);
    db.category.findMany.mockResolvedValue([
      { id: "d1", userId: null, name: "Food", color: "#f00", type: "expense" },
      { id: "d2", userId: null, name: "Salary", color: "#0f0", type: "income" },
    ]);

    await initializeUserDefaults("u1");

    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      create: { id: "u1" },
      update: {},
    });
    expect(db.category.findMany).toHaveBeenCalledWith({ where: { userId: null, name: { not: "Transfer" } } });
    expect(db.category.create).toHaveBeenCalledTimes(2);
    expect(db.category.create).toHaveBeenCalledWith({ data: { userId: "u1", name: "Food", color: "#f00", type: "expense" } });
    expect(db.category.create).toHaveBeenCalledWith({ data: { userId: "u1", name: "Salary", color: "#0f0", type: "income" } });
  });

  it("does not duplicate categories for a user who already has some", async () => {
    db.category.findFirst.mockResolvedValue({ id: "c1" });
    await initializeUserDefaults("u1");
    expect(db.category.create).not.toHaveBeenCalled();
    expect(db.category.findMany).not.toHaveBeenCalled();
  });
});

describe("deleteUserData", () => {
  it("deletes everything that belongs to the user, in one transaction, and says how much", async () => {
    db.transaction.deleteMany.mockResolvedValue({ count: 10 });
    db.account.deleteMany.mockResolvedValue({ count: 2 });
    db.category.deleteMany.mockResolvedValue({ count: 15 });
    db.userSettings.deleteMany.mockResolvedValue({ count: 1 });
    db.userGuide.deleteMany.mockResolvedValue({ count: 1 });
    db.user.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteUserData("u1");

    expect(result).toEqual({
      transactions: 10,
      accounts: 2,
      categories: 15,
      settings: 1,
      guide: 1,
      users: 1,
    });
    for (const model of ["transaction", "account", "category", "userSettings", "userGuide"] as const) {
      expect(db[model].deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    }
    expect(db.user.deleteMany).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it.each(["", "   ", undefined, null, 42])("never runs with an empty or invalid user id (%s)", async (userId) => {
    await expect(deleteUserData(userId as never)).rejects.toThrow("non-empty userId");
    expect(db.transaction.deleteMany).not.toHaveBeenCalled();
  });
});
