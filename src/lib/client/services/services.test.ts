import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/client", () => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), del: vi.fn() }));

import * as api from "@/lib/api/client";
import * as accounts from "./accounts";
import * as categories from "./categories";
import * as dashboard from "./dashboard";
import * as dashboardAccounts from "./dashboard-accounts";
import * as dashboardMonthly from "./dashboard-monthly";
import * as dashboardOverview from "./dashboard-overview";
import * as guide from "./guide";
import * as settings from "./settings";
import * as transactions from "./transactions";

const { get, post, patch, put, del } = vi.mocked(api);

describe("accounts", () => {
  it("lists accounts", async () => {
    get.mockResolvedValue({ accounts: [{ id: "a1" }], total: 1 });
    await expect(accounts.getAccounts()).resolves.toEqual([{ id: "a1" }]);
    expect(get).toHaveBeenCalledWith("/api/accounts");
  });

  it("creates, updates and deletes", async () => {
    const data = { name: "Main", type: "checking", currency: "USD", initialBalance: 1 } as never;
    await accounts.createAccount(data);
    await accounts.updateAccount("a1", data);
    await accounts.deleteAccount("a1");
    expect(post).toHaveBeenCalledWith("/api/accounts", data);
    expect(patch).toHaveBeenCalledWith("/api/accounts/a1", data);
    expect(del).toHaveBeenCalledWith("/api/accounts/a1");
  });

  it("saves the order of the accounts", async () => {
    await accounts.reorderAccounts(["b", "a"]);
    expect(put).toHaveBeenCalledWith("/api/accounts/order", { accountIds: ["b", "a"] });
  });
});

describe("categories", () => {
  it("lists, creates, updates and deletes", async () => {
    const data = { name: "Food", color: "#fff", type: "expense" } as never;
    await categories.getCategories();
    await categories.getSystemTransferCategory();
    await categories.createCategory(data);
    await categories.updateCategory("c1", data);
    await categories.deleteCategory("c1");
    expect(get).toHaveBeenCalledWith("/api/categories");
    expect(get).toHaveBeenCalledWith("/api/categories/system-transfer");
    expect(post).toHaveBeenCalledWith("/api/categories", data);
    expect(patch).toHaveBeenCalledWith("/api/categories/c1", data);
    expect(del).toHaveBeenCalledWith("/api/categories/c1");
  });
});

describe("transactions", () => {
  const data = { type: "expense", amount: 5, description: "x", date: new Date() } as never;

  it("lists, creates and reads the received side of a transfer", async () => {
    await transactions.getTransactions();
    await transactions.createTransaction(data);
    await transactions.getTransferTransactionByTransferId("tr1");
    expect(get).toHaveBeenCalledWith("/api/transactions");
    expect(post).toHaveBeenCalledWith("/api/transactions", data);
    expect(get).toHaveBeenCalledWith("/api/transactions/transfer/tr1");
  });

  it("updates with the scope given as an argument, or the one in the data", async () => {
    await transactions.updateTransaction("t1", data, "future");
    expect(patch).toHaveBeenLastCalledWith("/api/transactions/t1", { ...(data as object), updateScope: "future" });

    await transactions.updateTransaction("t1", { ...(data as object), updateScope: "one" } as never);
    expect(patch).toHaveBeenLastCalledWith("/api/transactions/t1", expect.objectContaining({ updateScope: "one" }));
  });

  it("deletes one, or this and the following ones", async () => {
    await transactions.deleteTransaction("t1");
    await transactions.deleteTransaction("t1", "future");
    expect(del).toHaveBeenNthCalledWith(1, "/api/transactions/t1");
    expect(del).toHaveBeenNthCalledWith(2, "/api/transactions/t1?scope=future");
  });
});

describe("dashboard", () => {
  it("asks for the dashboard without options", async () => {
    await dashboard.getDashboardData();
    expect(get).toHaveBeenCalledWith("/api/dashboard");
  });

  it("passes the options on in the query string", async () => {
    await dashboard.getDashboardData({ includeCurrentMonth: false, includePreviousMonth: true, month: "2026-10" });
    expect(get).toHaveBeenCalledWith("/api/dashboard?includeCurrentMonth=false&includePreviousMonth=true&month=2026-10");
  });

  it("reads balances, the monthly summary and the overview", async () => {
    await dashboardAccounts.getAccountBalances();
    await dashboardMonthly.getMonthlySummary("2026-10");
    await dashboardOverview.getAccountOverview();
    expect(get).toHaveBeenCalledWith("/api/dashboard/accounts");
    expect(get).toHaveBeenCalledWith("/api/dashboard/monthly?month=2026-10");
    expect(get).toHaveBeenCalledWith("/api/dashboard/overview");
  });
});

describe("guide and settings", () => {
  it("dismisses a tip", async () => {
    await guide.dismissTip("checklist");
    expect(post).toHaveBeenCalledWith("/api/guide/dismiss", { tipId: "checklist" });
  });

  it("reads and updates the settings", async () => {
    await settings.getSettings();
    await settings.updateSettings({ defaultCurrency: "EUR" });
    expect(get).toHaveBeenCalledWith("/api/settings");
    expect(patch).toHaveBeenCalledWith("/api/settings", { defaultCurrency: "EUR" });
  });
});
