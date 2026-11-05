import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPageShell } from "./DashboardPageShell";
import { dayjs } from "@/lib/utils/dayjs.js";
import type { Guide } from "@/lib/server/services/guide";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("./AccountsOverview", () => ({ AccountsOverview: () => null }));
vi.mock("./MonthlySummary", () => ({ MonthlySummary: () => <div>summary</div> }));
vi.mock("./NetWorthHero", () => ({ NetWorthHero: () => null }));
vi.mock("./TopSpendingCategories", () => ({ TopSpendingCategories: () => null }));
vi.mock("./SixMonthBarChart", () => ({ SixMonthBarChart: () => null }));
vi.mock("./ReorderAccountsModal", () => ({ ReorderAccountsModal: () => null }));
vi.mock("@/components/guide/GettingStarted", () => ({ GettingStarted: () => null }));
vi.mock("@/components/guide/MultiCurrencyHint", () => ({ MultiCurrencyHint: () => null }));
vi.mock("../../transactions/_components", () => ({ TransactionFormModal: () => null }));

const guide: Guide = {
  hasAccounts: true,
  checklist: null,
  showMultiCurrencyHint: false,
};

const month = {
  month: dayjs().format("YYYY-MM"),
  income: 0,
  expenses: 0,
  incomeFromExchange: 0,
  expensesFromExchange: 0,
  net: 0,
  categoryBreakdown: [],
  expectedIncome: null as number | null,
  expectedExpenses: null as number | null,
  expectedByCategory: {},
};

const props = {
  currency: "EUR",
  view: "currency" as const,
  homeCurrency: "EUR",
  currencyBalances: [{ currency: "EUR", balance: 1290 }],
  netWorth: { total: 1290, previousMonthTotal: 1290, change: 0, changePercent: 0 },
  accountBalances: [{ accountId: "a1", name: "test 34", currency: "EUR", balance: 1290 }],
  monthlyTotals: [month],
  sixMonthHistory: [],
  ratesAsOf: null,
  ratesError: null,
  accountOptions: [],
  categoryOptions: [],
  transferCategoryId: "t",
  guide,
};

describe("DashboardPageShell", () => {
  it("puts Plan this month on the current month in the summary heading", () => {
    render(<DashboardPageShell {...props} />);
    expect(screen.getByRole("button", { name: "Plan this month" })).toBeInTheDocument();
  });

  it("says View plan in the same heading slot once the month is planned", () => {
    render(
      <DashboardPageShell
        {...props}
        monthlyTotals={[{ ...month, expectedIncome: 3000, expectedExpenses: 200 }]}
      />
    );
    expect(screen.getByRole("button", { name: "View plan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Plan this month" })).not.toBeInTheDocument();
  });
});
