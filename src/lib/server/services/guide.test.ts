import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

import { prisma } from "@/lib/prisma";
import * as guide from "./guide";

const db = prisma as unknown as PrismaMock;

const givenUser = ({
  accounts = 0,
  transactions = 0,
  currencies = [] as string[],
  hasSettings = false,
  dismissed = undefined as unknown,
} = {}) => {
  db.account.count.mockResolvedValue(accounts);
  db.transaction.count.mockResolvedValue(transactions);
  db.account.findMany.mockResolvedValue(currencies.map((currency) => ({ currency })));
  db.userSettings.findUnique.mockResolvedValue(hasSettings ? { userId: "u1" } : null);
  db.userGuide.findUnique.mockResolvedValue(dismissed === undefined ? null : { userId: "u1", dismissed });
};

describe("getGuide", () => {
  it("shows the checklist to a brand new user, with nothing done", async () => {
    givenUser();
    const result = await guide.getGuide("u1");
    expect(result.hasAccounts).toBe(false);
    expect(result.checklist?.steps).toEqual([
      { id: "create-account", done: false },
      { id: "add-transaction", done: false },
    ]);
  });

  it("ticks the steps off by itself as the user makes progress", async () => {
    givenUser({ accounts: 1 });
    const result = await guide.getGuide("u1");
    expect(result.checklist?.steps.map((s) => s.done)).toEqual([true, false]);
  });

  it("goes away once everything is done", async () => {
    givenUser({ accounts: 1, transactions: 1 });
    expect((await guide.getGuide("u1")).checklist).toBeNull();
  });

  it("can be dismissed once there is an account", async () => {
    givenUser({ accounts: 1, dismissed: ["checklist"] });
    expect((await guide.getGuide("u1")).checklist).toBeNull();
  });

  it("cannot be dismissed before there is an account (nothing else to show)", async () => {
    givenUser({ accounts: 0, dismissed: ["checklist"] });
    expect((await guide.getGuide("u1")).checklist).not.toBeNull();
  });

  it("ignores a dismissed list that is not a list of text", async () => {
    givenUser({ accounts: 1, dismissed: { not: "a list" } });
    expect((await guide.getGuide("u1")).checklist).not.toBeNull();

    givenUser({ accounts: 1, dismissed: ["checklist", 5, null] });
    expect((await guide.getGuide("u1")).checklist).toBeNull();
  });

  describe("multi-currency hint", () => {
    it("shows with accounts in 2+ currencies and no chosen default", async () => {
      givenUser({ accounts: 2, currencies: ["USD", "EUR"] });
      expect((await guide.getGuide("u1")).showMultiCurrencyHint).toBe(true);
    });

    it.each([
      ["a single currency", { accounts: 1, currencies: ["USD"] }],
      ["a default currency already chosen", { accounts: 2, currencies: ["USD", "EUR"], hasSettings: true }],
      ["the hint dismissed", { accounts: 2, currencies: ["USD", "EUR"], dismissed: ["multi-currency"] }],
    ])("does not show with %s", async (_label, user) => {
      givenUser(user);
      expect((await guide.getGuide("u1")).showMultiCurrencyHint).toBe(false);
    });
  });
});

describe("dismissTip", () => {
  it("remembers a dismissed tip", async () => {
    givenUser({ dismissed: ["multi-currency"] });
    await guide.dismissTip("u1", "checklist");
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      create: { id: "u1" },
      update: {},
    });
    expect(db.userGuide.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", dismissed: ["multi-currency", "checklist"] },
      update: { dismissed: ["multi-currency", "checklist"] },
    });
  });

  it("starts the list for a user who never dismissed anything", async () => {
    givenUser();
    await guide.dismissTip("u1", "checklist");
    expect(db.userGuide.upsert.mock.calls[0][0].create.dismissed).toEqual(["checklist"]);
  });

  it("does nothing when the tip is already dismissed", async () => {
    givenUser({ dismissed: ["checklist"] });
    await guide.dismissTip("u1", "checklist");
    expect(db.userGuide.upsert).not.toHaveBeenCalled();
  });

  it.each(["unknown", 5, null, undefined])("rejects a tip that does not exist (%s)", async (tipId) => {
    await expect(guide.dismissTip("u1", tipId)).rejects.toThrow(ValidationError);
    expect(db.userGuide.upsert).not.toHaveBeenCalled();
  });
});
