import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

import { prisma } from "@/lib/prisma";
import * as transactions from "./transactions";

const db = prisma as unknown as PrismaMock;
const decimal = (value: number) => ({ toNumber: () => value });
const queryParams = (overrides: Record<string, unknown> = {}) => ({
  page: 1,
  pageSize: 20,
  sortField: "createdAt",
  sortOrder: "desc" as const,
  filters: {} as Record<string, string | undefined>,
  ...overrides,
});

describe("getTransactionsByUser", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    id: "t1",
    amount: decimal(12.5),
    isRecurring: false,
    recurringId: null,
    account: { id: "a1", name: "Main", initialBalance: decimal(100) },
    ...overrides,
  });

  beforeEach(() => {
    db.transaction.findMany.mockResolvedValue([row()]);
    db.transaction.count.mockResolvedValue(1);
  });

  it("returns the page with amounts as plain numbers, and the total", async () => {
    const result = await transactions.getTransactionsByUser("u1", queryParams());

    expect(result.total).toBe(1);
    expect(result.transactions[0].amount).toBe(12.5);
    expect(result.transactions[0].account.initialBalance).toBe(100);
  });

  it("keeps an account as it is when it has no initial balance to convert", async () => {
    db.transaction.findMany.mockResolvedValue([row({ account: { id: "a1", name: "Main", initialBalance: 0 } })]);
    const result = await transactions.getTransactionsByUser("u1", queryParams());
    expect(result.transactions[0].account).toEqual({ id: "a1", name: "Main", initialBalance: 0 });
  });

  it("pages and sorts in the database", async () => {
    await transactions.getTransactionsByUser("u1", queryParams({ page: 3, pageSize: 50, sortField: "date", sortOrder: "asc" }));

    expect(db.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 100, take: 50, orderBy: { date: "asc" } })
    );
  });

  it("only looks at the user's own transactions, and hides the incoming side of transfers", async () => {
    await transactions.getTransactionsByUser("u1", queryParams());
    const { where } = db.transaction.findMany.mock.calls[0][0];

    expect(where.userId).toBe("u1");
    expect(where.OR).toEqual([
      { transferId: null },
      { AND: [{ transferId: { not: null } }, { type: "expense" }, { category: { userId: null } }] },
    ]);
  });

  it("applies the account, category, type and description filters", async () => {
    await transactions.getTransactionsByUser(
      "u1",
      queryParams({ filters: { accountId: "a1", categoryId: "c1", type: "income", description: "coffee (big)" } })
    );
    const { where } = db.transaction.findMany.mock.calls[0][0];

    expect(where).toMatchObject({
      accountId: "a1",
      categoryId: "c1",
      type: "income",
      description: { contains: "coffee big" }, // search text is sanitized
    });
  });

  it("filters by month, and ignores a month that makes no sense", async () => {
    await transactions.getTransactionsByUser("u1", queryParams({ filters: { month: "2026-02" } }));
    const { where } = db.transaction.findMany.mock.calls[0][0];
    expect(where.date.gte.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(where.date.lte.toISOString()).toBe("2026-02-28T23:59:59.999Z");

    db.transaction.findMany.mockClear();
    await transactions.getTransactionsByUser("u1", queryParams({ filters: { month: "nonsense" } }));
    expect(db.transaction.findMany.mock.calls[0][0].where.date).toBeUndefined();
  });

  it("numbers the occurrences of a recurring transaction (3 of 4)", async () => {
    db.transaction.findMany
      .mockResolvedValueOnce([row({ id: "t3", isRecurring: true, recurringId: "r1" }), row({ id: "t9" })])
      .mockResolvedValueOnce([{ id: "t1" }, { id: "t2" }, { id: "t3" }, { id: "t4" }]);

    const result = await transactions.getTransactionsByUser("u1", queryParams());

    expect(result.transactions[0]).toMatchObject({ currentInstallment: 3, totalInstallments: 4 });
    expect(result.transactions[1].currentInstallment).toBeUndefined();
    // one lookup for the page, one for the recurring group
    expect(db.transaction.findMany).toHaveBeenCalledTimes(2);
    expect(db.transaction.findMany.mock.calls[1][0].where).toEqual({ recurringId: "r1" });
  });

  it("leaves a recurring transaction alone when its group cannot be found", async () => {
    db.transaction.findMany
      .mockResolvedValueOnce([row({ id: "t3", isRecurring: true, recurringId: "r1" })])
      .mockResolvedValueOnce([]);

    const result = await transactions.getTransactionsByUser("u1", queryParams());
    expect(result.transactions[0].currentInstallment).toBeUndefined();
  });
});

describe("getTransferTransactionByTransferId", () => {
  it("returns the incoming side of a transfer with plain numbers", async () => {
    db.transaction.findFirst.mockResolvedValue({
      id: "in1",
      amount: decimal(520),
      account: { id: "a2", initialBalance: decimal(10) },
    });

    const result = await transactions.getTransferTransactionByTransferId({ transferId: "tr1", userId: "u1" });

    expect(db.transaction.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { transferId: "tr1", userId: "u1", type: "income" } })
    );
    expect(result.amount).toBe(520);
    expect(result.account.initialBalance).toBe(10);
  });

  it("keeps the account as it is when there is no initial balance to convert", async () => {
    db.transaction.findFirst.mockResolvedValue({ id: "in1", amount: decimal(1), account: { id: "a2", initialBalance: 0 } });
    const result = await transactions.getTransferTransactionByTransferId({ transferId: "tr1", userId: "u1" });
    expect(result.account).toEqual({ id: "a2", initialBalance: 0 });
  });

  it("fails when the transfer does not exist", async () => {
    db.transaction.findFirst.mockResolvedValue(null);
    await expect(transactions.getTransferTransactionByTransferId({ transferId: "x", userId: "u1" })).rejects.toThrow(NotFoundError);
  });
});

describe("createTransferTransaction", () => {
  const props = { fromAccountId: "usd1", toAccountId: "usd2", amount: 100, description: "Move", date: "2026-10-20" };

  beforeEach(() => {
    db.category.findFirst.mockResolvedValue({ id: "transfer-cat" });
    db.account.findMany.mockResolvedValue([
      { id: "usd1", currency: "USD" },
      { id: "usd2", currency: "USD" },
      { id: "brl1", currency: "BRL" },
    ]);
  });

  const created = () => db.transaction.createMany.mock.calls[0][0].data as Record<string, unknown>[];

  it("creates an outgoing and an incoming side that share a transfer id", async () => {
    await transactions.createTransferTransaction("u1", props);

    const [out, inn] = created();
    expect(out).toMatchObject({ type: "expense", accountId: "usd1", amount: 100, categoryId: "transfer-cat", userId: "u1" });
    expect(inn).toMatchObject({ type: "income", accountId: "usd2", amount: 100, categoryId: "transfer-cat", userId: "u1" });
    expect(out.transferId).toBeTruthy();
    expect(out.transferId).toBe(inn.transferId);
    expect(out.date).toEqual(new Date("2026-10-20"));
  });

  it("stores a negative amount as positive", async () => {
    await transactions.createTransferTransaction("u1", { ...props, amount: -100 });
    expect(created().map((c) => c.amount)).toEqual([100, 100]);
  });

  it("uses the amount received for the incoming side when the currencies differ", async () => {
    await transactions.createTransferTransaction("u1", { ...props, toAccountId: "brl1", toAmount: 520 });
    expect(created().map((c) => c.amount)).toEqual([100, 520]);
  });

  it("needs the amount received when the currencies differ", async () => {
    const attempt = transactions.createTransferTransaction("u1", { ...props, toAccountId: "brl1" });
    await expect(attempt).rejects.toThrow("Enter the amount received in BRL");
    await expect(
      transactions.createTransferTransaction("u1", { ...props, toAccountId: "brl1", toAmount: -3 })
    ).resolves.toBeDefined(); // a negative amount is read as its absolute value
    await expect(
      transactions.createTransferTransaction("u1", { ...props, toAccountId: "brl1", toAmount: Number.NaN })
    ).rejects.toThrow(ValidationError);
  });

  it("falls back to a default description", async () => {
    await transactions.createTransferTransaction("u1", { ...props, description: undefined });
    expect(created().map((c) => c.description)).toEqual(["Transfer to another account", "Transfer from another account"]);
  });

  it("fails when the Transfer category is missing", async () => {
    db.category.findFirst.mockResolvedValue(null);
    await expect(transactions.createTransferTransaction("u1", props)).rejects.toThrow("Transfer category not found");
  });

  it.each([
    [{ fromAccountId: "" }, "Missing transfer data"],
    [{ toAccountId: "" }, "Missing transfer data"],
    [{ amount: 0 }, "Missing transfer data"],
    [{ toAccountId: "usd1" }, "Cannot transfer to the same account"],
  ])("rejects %o", async (override, message) => {
    await expect(transactions.createTransferTransaction("u1", { ...props, ...override })).rejects.toThrow(message);
    expect(db.transaction.createMany).not.toHaveBeenCalled();
  });

  it("only moves money between the user's own accounts", async () => {
    db.account.findMany.mockResolvedValue([{ id: "usd1", currency: "USD" }]);
    await expect(transactions.createTransferTransaction("u1", props)).rejects.toThrow(NotFoundError);
    expect(db.account.findMany.mock.calls[0][0].where.userId).toBe("u1");
  });
});

describe("createTransaction", () => {
  const props = {
    type: "expense" as const,
    amount: -25,
    accountId: "a1",
    categoryId: "c1",
    description: "Lunch",
    date: new Date("2026-10-20"),
  };

  it("saves the amount as a positive number and returns it as a number", async () => {
    db.transaction.create.mockResolvedValue({ id: "t1", amount: decimal(25) });

    const result = await transactions.createTransaction("u1", props);

    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "u1" },
      create: { id: "u1" },
      update: {},
    });
    expect(db.transaction.create).toHaveBeenCalledWith({
      data: { userId: "u1", type: "expense", amount: 25, accountId: "a1", categoryId: "c1", description: "Lunch", date: props.date, isRecurring: false },
    });
    expect(result.amount).toBe(25);
  });

  it("stores 1 November at UTC midnight so it stays in November", async () => {
    db.transaction.create.mockResolvedValue({ id: "t1", amount: decimal(25) });
    await transactions.createTransaction("u1", { ...props, date: "2026-11-01" });
    expect(db.transaction.create.mock.calls[0][0].data.date.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("passes on the recurring flag", async () => {
    db.transaction.create.mockResolvedValue({ id: "t1", amount: decimal(25) });
    await transactions.createTransaction("u1", { ...props, isRecurring: true });
    expect(db.transaction.create.mock.calls[0][0].data.isRecurring).toBe(true);
  });

  it.each([{ accountId: "" }, { categoryId: "" }])("needs an account and a category (%o)", async (override) => {
    await expect(transactions.createTransaction("u1", { ...props, ...override })).rejects.toThrow("Missing required transaction data");
  });
});

describe("createRecurringTransaction", () => {
  const props = {
    type: "expense" as const,
    amount: -10,
    accountId: "a1",
    categoryId: "c1",
    description: "Gym",
    date: new Date("2026-01-31T12:00:00.000Z"),
    frequency: "monthly",
  };

  const rows = () => db.transaction.createMany.mock.calls[0][0].data as { date: Date; recurringId: string; amount: number }[];

  it("creates 12 occurrences when there is no end date", async () => {
    const result = await transactions.createRecurringTransaction("u1", props);

    expect(result.count).toBe(12);
    expect(result.message).toBe("Created 12 recurring transaction(s)");
    expect(rows()).toHaveLength(12);
    expect(new Set(rows().map((r) => r.recurringId)).size).toBe(1);
    expect(result.recurringId).toBe(rows()[0].recurringId);
    expect(rows()[0].amount).toBe(10);
    expect(db.transaction.createMany.mock.calls[0][0].data[0]).toMatchObject({ isRecurring: true, frequency: "monthly", endsAt: null });
  });

  it("stops at the end date", async () => {
    const result = await transactions.createRecurringTransaction("u1", {
      ...props,
      date: new Date("2026-01-01T12:00:00.000Z"),
      frequency: "weekly",
      endsAt: new Date("2026-01-22T12:00:00.000Z"),
    });
    // Jan 1, 8, 15, 22
    expect(result.count).toBe(4);
  });

  it.each([
    ["daily", new Date("2026-01-01T12:00:00.000Z"), new Date("2026-01-03T12:00:00.000Z"), 3],
    ["monthly", new Date("2026-01-01T12:00:00.000Z"), new Date("2026-04-01T12:00:00.000Z"), 4],
    ["yearly", new Date("2026-01-01T12:00:00.000Z"), new Date("2028-01-01T12:00:00.000Z"), 3],
  ])("repeats %s", async (frequency, date, endsAt, expected) => {
    const result = await transactions.createRecurringTransaction("u1", { ...props, date, frequency, endsAt });
    expect(result.count).toBe(expected);
  });

  it("still creates the first one when the end date is before the start", async () => {
    const result = await transactions.createRecurringTransaction("u1", { ...props, endsAt: new Date(2020, 0, 1) });
    expect(result.count).toBe(1);
    expect(rows()[0].date.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("rejects a frequency it does not know", async () => {
    await expect(transactions.createRecurringTransaction("u1", { ...props, frequency: "hourly" })).rejects.toThrow("Invalid frequency: hourly");
    expect(db.transaction.createMany).not.toHaveBeenCalled();
  });

  it.each([{ accountId: "" }, { categoryId: "" }])("needs an account and a category (%o)", async (override) => {
    await expect(transactions.createRecurringTransaction("u1", { ...props, ...override })).rejects.toThrow("Missing required transaction data");
  });
});

describe("updateTransaction", () => {
  const props = {
    id: "t1",
    type: "expense" as const,
    amount: -30,
    accountId: "a2",
    categoryId: "c2",
    description: "New",
    date: new Date("2026-10-21"),
  };
  const existing = { id: "t1", type: "expense", recurringId: "r1", date: new Date("2026-10-01") };

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("fails when the transaction is not the user's", async () => {
    db.transaction.findUnique.mockResolvedValue(null);
    await expect(transactions.updateTransaction("u1", props)).rejects.toThrow(NotFoundError);
    expect(db.transaction.findUnique).toHaveBeenCalledWith({ where: { id: "t1", userId: "u1" } });
  });

  it("updates just this transaction by default, keeping its type", async () => {
    db.transaction.findUnique.mockResolvedValue(existing);
    db.transaction.update.mockResolvedValue({ id: "t1", amount: decimal(30) });

    const result = await transactions.updateTransaction("u1", props);

    expect(db.transaction.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { type: "expense", amount: 30, accountId: "a2", categoryId: "c2", description: "New", date: props.date },
    });
    expect((result as { amount: number }).amount).toBe(30);
  });

  it("updates this and every later occurrence of a recurring transaction", async () => {
    db.transaction.findUnique.mockResolvedValue(existing);
    db.transaction.updateMany.mockResolvedValue({ count: 5 });

    const result = await transactions.updateTransaction("u1", props, { updateScope: "future" });

    expect(db.transaction.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1", recurringId: "r1", date: { gte: existing.date } },
      data: { type: "expense", amount: 30, accountId: "a2", categoryId: "c2", description: "New" },
    });
    expect(result).toEqual({ message: "Updated 5 transaction(s) successfully", count: 5 });
  });

  it("does not update 'future' occurrences of something that is not recurring", async () => {
    db.transaction.findUnique.mockResolvedValue({ ...existing, recurringId: null });
    await expect(transactions.updateTransaction("u1", props, { updateScope: "future" })).rejects.toThrow("not recurring");
  });

  it("does not update 'future' occurrences from a transaction without a date", async () => {
    db.transaction.findUnique.mockResolvedValue({ ...existing, date: null });
    await expect(transactions.updateTransaction("u1", props, { updateScope: "future" })).rejects.toThrow("date is missing");
  });
});

describe("updateTransferTransaction", () => {
  const props = {
    id: "out1",
    fromAccountId: "usd1",
    toAccountId: "brl1",
    amount: 100,
    toAmount: 555.5,
    description: "Move",
    date: "2026-10-21",
  };
  const legs = [
    { id: "out1", type: "expense", transferId: "tr1" },
    { id: "in1", type: "income", transferId: "tr1" },
  ];

  beforeEach(() => {
    db.transaction.findUnique.mockResolvedValue(legs[0]);
    db.transaction.findMany.mockResolvedValue(legs);
    db.account.findMany.mockResolvedValue([
      { id: "usd1", currency: "USD" },
      { id: "usd2", currency: "USD" },
      { id: "brl1", currency: "BRL" },
    ]);
    db.transaction.update.mockImplementation(async (args: unknown) => args);
  });

  it("updates both sides, with the amount sent and the amount received", async () => {
    await transactions.updateTransferTransaction("u1", props);

    expect(db.transaction.update).toHaveBeenCalledWith({
      where: { id: "out1" },
      data: { amount: 100, accountId: "usd1", description: "Move", date: new Date("2026-10-21") },
    });
    expect(db.transaction.update).toHaveBeenCalledWith({
      where: { id: "in1" },
      data: { amount: 555.5, accountId: "brl1", description: "Move", date: new Date("2026-10-21") },
    });
  });

  it("finds the transfer from the transaction itself, not from what the client says", async () => {
    await transactions.updateTransferTransaction("u1", props);
    expect(db.transaction.findUnique).toHaveBeenCalledWith({ where: { id: "out1", userId: "u1" } });
    expect(db.transaction.findMany).toHaveBeenCalledWith({ where: { userId: "u1", transferId: "tr1" } });
  });

  it("gives both sides the same amount when the accounts share a currency", async () => {
    await transactions.updateTransferTransaction("u1", { ...props, toAccountId: "usd2", toAmount: 12345 });
    const amounts = db.transaction.update.mock.calls.map((call) => call[0].data.amount);
    expect(amounts).toEqual([100, 100]);
  });

  it("changes nothing when the amount received is missing for different currencies", async () => {
    await expect(transactions.updateTransferTransaction("u1", { ...props, toAmount: undefined })).rejects.toThrow("amount received");
    expect(db.transaction.update).not.toHaveBeenCalled();
  });

  it("rejects the same account on both sides", async () => {
    await expect(transactions.updateTransferTransaction("u1", { ...props, toAccountId: "usd1" })).rejects.toThrow("same account");
  });

  it("fails when the transaction is not part of a transfer, or not the user's", async () => {
    db.transaction.findUnique.mockResolvedValue({ id: "out1", transferId: null });
    await expect(transactions.updateTransferTransaction("u1", props)).rejects.toThrow(NotFoundError);
    db.transaction.findUnique.mockResolvedValue(null);
    await expect(transactions.updateTransferTransaction("u1", props)).rejects.toThrow(NotFoundError);
  });

  it("fails when the transfer does not have exactly two sides", async () => {
    db.transaction.findMany.mockResolvedValue([legs[0]]);
    await expect(transactions.updateTransferTransaction("u1", props)).rejects.toThrow(NotFoundError);
  });

  it("fails when the two sides are not one outgoing and one incoming", async () => {
    db.transaction.findMany.mockResolvedValue([legs[0], { id: "out2", type: "expense", transferId: "tr1" }]);
    await expect(transactions.updateTransferTransaction("u1", props)).rejects.toThrow("Invalid transfer transaction data");
  });
});

describe("deleteTransaction", () => {
  it("fails when the transaction is not the user's, and only ever looks at the user's own", async () => {
    db.transaction.findUnique.mockResolvedValue(null);
    await expect(transactions.deleteTransaction("u1", "t1")).rejects.toThrow(NotFoundError);
    expect(db.transaction.findUnique).toHaveBeenCalledWith({ where: { id: "t1", userId: "u1" } });
    expect(db.transaction.delete).not.toHaveBeenCalled();
    expect(db.transaction.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes one transaction", async () => {
    db.transaction.findUnique.mockResolvedValue({ id: "t1" });
    await transactions.deleteTransaction("u1", "t1");
    expect(db.transaction.delete).toHaveBeenCalledWith({ where: { id: "t1", userId: "u1" } });
  });

  it("deletes both sides of a transfer together", async () => {
    db.transaction.findUnique.mockResolvedValue({ id: "t1", transferId: "tr1" });
    await transactions.deleteTransaction("u1", "t1");
    expect(db.transaction.deleteMany).toHaveBeenCalledWith({ where: { transferId: "tr1" } });
    expect(db.transaction.delete).not.toHaveBeenCalled();
  });

  it("deletes this and every later occurrence of a recurring transaction", async () => {
    const date = new Date("2026-10-01");
    db.transaction.findUnique.mockResolvedValue({ id: "t1", recurringId: "r1", date });
    const result = await transactions.deleteTransaction("u1", "t1", { scope: "future" });
    expect(db.transaction.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", recurringId: "r1", date: { gte: date } } });
    expect(result.message).toContain("future occurrences");
  });

  it("does not delete 'future' occurrences of something that is not recurring", async () => {
    db.transaction.findUnique.mockResolvedValue({ id: "t1", recurringId: null });
    await expect(transactions.deleteTransaction("u1", "t1", { scope: "future" })).rejects.toThrow("not recurring");
    expect(db.transaction.deleteMany).not.toHaveBeenCalled();
  });
});
