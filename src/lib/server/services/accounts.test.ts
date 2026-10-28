import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import * as accounts from "./accounts";

const db = prisma as unknown as PrismaMock;
const decimal = (value: number) => ({ toNumber: () => value });
const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const queryParams = (overrides: Record<string, unknown> = {}) => ({
  page: 2,
  pageSize: 10,
  sortField: "name",
  sortOrder: "asc" as const,
  filters: {} as Record<string, string | undefined>,
  ...overrides,
});

describe("calculateAccountBalance", () => {
  it("is the initial balance plus income minus expenses", async () => {
    db.transaction.findMany.mockResolvedValue([
      { type: "income", amount: decimal(100), transferId: null },
      { type: "expense", amount: decimal(30), transferId: null },
      { type: "income", amount: 20, transferId: "tr1" }, // money received from a transfer
      { type: "expense", amount: 5, transferId: "tr2" }, // money sent in a transfer
    ]);

    const balance = await accounts.calculateAccountBalance({ id: "a1", initialBalance: decimal(1000) } as never);

    expect(balance).toBe(1085);
  });

  it("does not count future transactions", async () => {
    db.transaction.findMany.mockResolvedValue([]);
    await accounts.calculateAccountBalance({ id: "a1", initialBalance: decimal(0) } as never);
    expect(db.transaction.findMany.mock.calls[0][0].where).toEqual({ accountId: "a1", date: { lte: expect.any(Date) } });
  });
});

describe("getAccountWithBalance", () => {
  it("returns the account with its current balance", async () => {
    db.account.findUnique.mockResolvedValue({ id: "a1", name: "Main", initialBalance: decimal(10) });
    db.transaction.findMany.mockResolvedValue([{ type: "income", amount: decimal(5), transferId: null }]);

    const result = await accounts.getAccountWithBalance("u1", "a1");

    expect(result.currentBalance).toBe(15);
    expect(db.account.findUnique.mock.calls[0][0].where).toEqual({ id: "a1", userId: "u1" });
  });

  it("fails when the account is not the user's", async () => {
    db.account.findUnique.mockResolvedValue(null);
    await expect(accounts.getAccountWithBalance("u1", "a1")).rejects.toThrow(NotFoundError);
  });
});

describe("listAccounts (for the accounts page)", () => {
  beforeEach(() => {
    db.account.findMany.mockResolvedValue([{ id: "a1", initialBalance: decimal(10) }]);
    db.account.count.mockResolvedValue(1);
  });

  it("sends the visitor to the login page when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    await expect(accounts.listAccounts(queryParams())).rejects.toThrow("REDIRECT:/login");
    expect(db.account.findMany).not.toHaveBeenCalled();
  });

  it("lists the signed-in user's accounts with numeric balances, pages and filters", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });

    const result = await accounts.listAccounts(queryParams({ filters: { type: "checking", currency: "USD" } }));

    expect(result).toEqual({ accounts: [{ id: "a1", initialBalance: 10 }], total: 1 });
    expect(db.account.findMany).toHaveBeenCalledWith({
      where: { userId: "u1", type: "checking", currency: "USD" },
      orderBy: { name: "asc" },
      skip: 10,
      take: 10,
    });
  });
});

describe("getAccountsByUser (API)", () => {
  it("pages the user's accounts and returns plain numbers", async () => {
    db.account.findMany.mockResolvedValue([{ id: "a1", initialBalance: decimal(7) }]);
    db.account.count.mockResolvedValue(11);

    const result = await accounts.getAccountsByUser("u1", queryParams({ sortField: undefined, sortOrder: undefined }));

    expect(result).toEqual({ accounts: [{ id: "a1", initialBalance: 7 }], total: 11 });
    expect(db.account.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      orderBy: { createdAt: "desc" },
      skip: 10,
      take: 10,
    });
  });
});

describe("reorderAccounts", () => {
  beforeEach(() => {
    db.account.findMany.mockResolvedValue([
      { id: "a", currency: "USD" },
      { id: "b", currency: "USD" },
      { id: "c", currency: "USD" },
    ]);
    db.account.update.mockImplementation(async (args: unknown) => args);
  });

  it("saves each account's position", async () => {
    const result = await accounts.reorderAccounts("u1", ["c", "a", "b"]);

    expect(result.message).toBe("Accounts reordered successfully");
    expect(db.account.update.mock.calls.map((call) => call[0])).toEqual([
      { where: { id: "c", userId: "u1" }, data: { sortOrder: 0 } },
      { where: { id: "a", userId: "u1" }, data: { sortOrder: 1 } },
      { where: { id: "b", userId: "u1" }, data: { sortOrder: 2 } },
    ]);
  });

  it.each([
    ["not a list", "a"],
    ["an empty list", []],
    ["ids that are not text", ["a", 2]],
    ["too many ids", Array.from({ length: 501 }, (_, i) => `id${i}`)],
  ])("rejects %s", async (_label, input) => {
    await expect(accounts.reorderAccounts("u1", input)).rejects.toThrow(ValidationError);
    expect(db.account.update).not.toHaveBeenCalled();
  });

  it("rejects the same account twice", async () => {
    await expect(accounts.reorderAccounts("u1", ["a", "a"])).rejects.toThrow("only appear once");
  });

  it("only orders the user's own accounts", async () => {
    db.account.findMany.mockResolvedValue([{ id: "a", currency: "USD" }]); // "b" belongs to someone else
    await expect(accounts.reorderAccounts("u1", ["a", "b"])).rejects.toThrow(NotFoundError);
    expect(db.account.findMany.mock.calls[0][0].where).toEqual({ userId: "u1", id: { in: ["a", "b"] } });
    expect(db.account.update).not.toHaveBeenCalled();
  });

  it("orders each currency separately", async () => {
    db.account.findMany.mockResolvedValue([
      { id: "a", currency: "USD" },
      { id: "b", currency: "EUR" },
    ]);
    await expect(accounts.reorderAccounts("u1", ["a", "b"])).rejects.toThrow("ordered separately");
    expect(db.account.update).not.toHaveBeenCalled();
  });
});

describe("getUserAccounts", () => {
  it("returns every account with its balance", async () => {
    db.account.findMany.mockResolvedValue([
      { id: "a1", name: "Main", currency: "USD", initialBalance: decimal(100) },
      { id: "a2", name: "Euro", currency: "EUR", initialBalance: decimal(5) },
    ]);
    db.transaction.findMany.mockImplementation(async (args: { where: { accountId: string } }) =>
      args.where.accountId === "a1" ? [{ type: "expense", amount: decimal(40), transferId: null }] : []
    );

    const result = await accounts.getUserAccounts("u1");

    expect(result.map((a) => [a.id, a.initialBalance, a.balance])).toEqual([
      ["a1", 100, 60],
      ["a2", 5, 5],
    ]);
  });
});

describe("getUserAccountsWithBalances", () => {
  it("returns balances per account and the total of each currency", async () => {
    db.account.findMany.mockResolvedValue([
      { id: "a1", name: "Main", currency: "USD", initialBalance: decimal(100) },
      { id: "a2", name: "Cash", currency: "USD", initialBalance: decimal(50) },
      { id: "a3", name: "Euro", currency: "EUR", initialBalance: decimal(5) },
    ]);
    db.transaction.findMany.mockResolvedValue([]);

    const result = await accounts.getUserAccountsWithBalances("u1");

    expect(result.totalBalanceByCurrency).toEqual({ USD: 150, EUR: 5 });
    expect(result.accountBalances).toEqual([
      { accountId: "a1", name: "Main", currency: "USD", balance: 100 },
      { accountId: "a2", name: "Cash", currency: "USD", balance: 50 },
      { accountId: "a3", name: "Euro", currency: "EUR", balance: 5 },
    ]);
  });
});

describe("createAccount", () => {
  const data = { name: "Main", type: "checking", currency: "USD", initialBalance: 10 } as never;

  it("creates the account for the user", async () => {
    db.category.findFirst.mockResolvedValue({ id: "c1" });
    db.account.create.mockResolvedValue({ id: "a1" });
    await expect(accounts.createAccount("u1", data)).resolves.toEqual({ id: "a1" });
    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      create: { id: "u1" },
      update: {},
    });
    expect(db.account.create).toHaveBeenCalledWith({
      data: { userId: "u1", name: "Main", type: "checking", currency: "USD", initialBalance: 10 },
    });
  });

  it("does not insert an account until the users row exists", async () => {
    db.category.findFirst.mockResolvedValue({ id: "c1" });
    db.user.upsert.mockRejectedValue(new Error("users missing"));
    await expect(accounts.createAccount("u1", data)).rejects.toThrow("users missing");
    expect(db.account.create).not.toHaveBeenCalled();
  });

  it.each([{ name: "" }, { type: "" }, { currency: "" }])("needs a name, type and currency (%o)", async (override) => {
    await expect(accounts.createAccount("u1", { ...(data as object), ...override } as never)).rejects.toThrow("Missing required account data");
  });
});

describe("updateAccount", () => {
  it("updates the user's account", async () => {
    db.account.findUnique.mockResolvedValue({ id: "a1" });
    db.account.update.mockResolvedValue({ id: "a1", name: "New" });

    await accounts.updateAccount("u1", "a1", { name: "New" });

    expect(db.account.findUnique).toHaveBeenCalledWith({ where: { id: "a1", userId: "u1" } });
    expect(db.account.update.mock.calls[0][0].where).toEqual({ id: "a1" });
    expect(db.account.update.mock.calls[0][0].data.name).toBe("New");
  });

  it("fails when the account is not the user's", async () => {
    db.account.findUnique.mockResolvedValue(null);
    await expect(accounts.updateAccount("u1", "a1", { name: "New" })).rejects.toThrow(NotFoundError);
    expect(db.account.update).not.toHaveBeenCalled();
  });
});

describe("deleteAccount", () => {
  it("deletes an account that has no transactions", async () => {
    db.account.findUnique.mockResolvedValue({ id: "a1" });
    db.transaction.count.mockResolvedValue(0);

    await expect(accounts.deleteAccount("u1", "a1")).resolves.toEqual({ message: "Account deleted successfully" });
    expect(db.account.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
  });

  it("keeps an account that still has transactions", async () => {
    db.account.findUnique.mockResolvedValue({ id: "a1" });
    db.transaction.count.mockResolvedValue(3);

    await expect(accounts.deleteAccount("u1", "a1")).rejects.toThrow("existing transactions");
    expect(db.account.delete).not.toHaveBeenCalled();
  });

  it("fails when the account is not the user's", async () => {
    db.account.findUnique.mockResolvedValue(null);
    await expect(accounts.deleteAccount("u1", "a1")).rejects.toThrow(NotFoundError);
  });
});
