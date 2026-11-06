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
    upsertExchangeExpected: vi.fn(),
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
  availableCurrencies: ["USD", "EUR"],
  yearMonth: "2026-11",
  ratesAsOf: null,
  ratesError: null,
  hasPlan: true,
  canEdit: true,
  copyFromMonth: "2026-10",
  income: [{ categoryId: "salary", name: "Salary", color: "#0f0", expected: 3000, actual: 0 }],
  expenses: [{ categoryId: "food", name: "Food", color: "#f00", expected: 200, actual: 40 }],
  exchangeIn: { expected: null, actual: 0 },
  exchangeOut: { expected: null, actual: 0 },
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
    expect(screen.getByText("From other currencies")).toBeInTheDocument();
    expect(screen.getByText("To other currencies")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy previous month" })).toBeInTheDocument();
  });

  it("hides from/to other currencies when those lines are not on the plan", () => {
    render(
      <BudgetPageShell budget={{ ...budget, availableCurrencies: ["USD"], exchangeIn: null, exchangeOut: null }} />
    );
    expect(screen.queryByText("From other currencies")).not.toBeInTheDocument();
    expect(screen.queryByText("To other currencies")).not.toBeInTheDocument();
  });

  it("keeps Copy previous month on the current month even with nothing to copy", () => {
    render(
      <BudgetPageShell
        budget={{ ...budget, copyFromMonth: null, hasPlan: false, yearMonth: "2026-11" }}
      />
    );
    expect(screen.getByRole("button", { name: "Copy previous month" })).toBeDisabled();
  });

  it("treats extra income as more than expected, not as overspend", () => {
    render(
      <BudgetPageShell
        budget={{
          ...budget,
          income: [{ categoryId: "other", name: "Other", color: "#0aa", expected: 500, actual: 600 }],
        }}
      />
    );
    expect(screen.getByText(/more than expected/)).toBeInTheDocument();
    expect(screen.queryByText(/over expected/)).not.toBeInTheDocument();
    expect(screen.getByText(/more than expected/).className).toContain("text-primary");
  });

  it("treats extra expenses as over expected in red", () => {
    render(
      <BudgetPageShell
        budget={{
          ...budget,
          expenses: [{ categoryId: "food", name: "Food", color: "#f00", expected: 200, actual: 250 }],
        }}
      />
    );
    expect(screen.getByText(/over expected/)).toBeInTheDocument();
    expect(screen.getByText(/over expected/).className).toContain("text-red-600");
  });

  it("asks before overriding a month that already has a plan", async () => {
    const user = userEvent.setup();
    render(<BudgetPageShell budget={budget} />);
    await user.click(screen.getByRole("button", { name: "Copy previous month" }));
    expect(screen.getByText("Replace this month's plan?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This month already has expected amounts, including from and to other currencies. Copying last month will override them."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Override" })).toBeInTheDocument();
  });
});
