import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BudgetPageShell } from "./BudgetPageShell";
import type { BudgetData } from "@/lib/client/services/budget";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/client/services", () => ({
  budgetService: {
    copyPreviousMonth: vi.fn(),
    upsertExpected: vi.fn(),
  },
}));

vi.mock("@/lib/utils/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const budget: BudgetData = {
  currency: "USD",
  view: "currency",
  homeCurrency: "USD",
  availableCurrencies: ["USD"],
  yearMonth: "2026-11",
  ratesAsOf: null,
  ratesError: null,
  hasPlan: true,
  canEdit: true,
  copyFromMonth: "2026-10",
  income: [{ categoryId: "salary", name: "Salary", color: "#0f0", expected: 3000, actual: 0 }],
  expenses: [{ categoryId: "food", name: "Food", color: "#f00", expected: 200, actual: 40 }],
  totals: {
    expectedIncome: 3000,
    actualIncome: 0,
    expectedExpenses: 200,
    actualExpenses: 40,
    expectedNet: 2800,
    actualNet: -40,
  },
};

describe("BudgetPageShell", () => {
  it("shows expected income and expenses for the month", () => {
    render(<BudgetPageShell budget={budget} />);
    expect(screen.getByRole("heading", { name: "Budget" })).toBeInTheDocument();
    expect(screen.getByText("Expected income")).toBeInTheDocument();
    expect(screen.getByText("Expected expenses")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy previous month" })).toBeInTheDocument();
  });

  it("keeps Copy previous month on the current month even with nothing to copy", () => {
    render(
      <BudgetPageShell
        budget={{ ...budget, copyFromMonth: null, hasPlan: false, yearMonth: "2026-11" }}
      />
    );
    expect(screen.getByRole("button", { name: "Copy previous month" })).toBeDisabled();
  });

  it("asks before overriding a month that already has a plan", async () => {
    const user = userEvent.setup();
    render(<BudgetPageShell budget={budget} />);
    await user.click(screen.getByRole("button", { name: "Copy previous month" }));
    expect(screen.getByText("Replace this month's plan?")).toBeInTheDocument();
    expect(
      screen.getByText("This month already has expected amounts. Copying last month will override them.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Override" })).toBeInTheDocument();
  });
});
