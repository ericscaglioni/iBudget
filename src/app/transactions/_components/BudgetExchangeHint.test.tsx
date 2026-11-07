import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/client/services", () => ({
  budgetService: { getExchangeStatus: vi.fn() },
}));

import { budgetService } from "@/lib/client/services";
import { BudgetExchangeHint } from "./BudgetExchangeHint";

describe("BudgetExchangeHint", () => {
  it("says how much is left of expected from other currencies", async () => {
    vi.mocked(budgetService.getExchangeStatus).mockResolvedValue({ expected: 3000, actual: 500 });
    render(
      <BudgetExchangeHint direction="in" amount="400" date="2026-11-04" currency="EUR" />
    );
    await waitFor(() => {
      expect(screen.getByText(/left of/)).toBeInTheDocument();
      expect(screen.getByText(/expected from other currencies/)).toBeInTheDocument();
    });
  });

  it("stays quiet when there is no plan", async () => {
    vi.mocked(budgetService.getExchangeStatus).mockResolvedValue({ expected: null, actual: 10 });
    render(
      <BudgetExchangeHint direction="out" amount="200" date="2026-11-04" currency="USD" />
    );
    await waitFor(() => expect(budgetService.getExchangeStatus).toHaveBeenCalled());
    expect(screen.queryByText(/left of/)).not.toBeInTheDocument();
  });

  it("does not treat extra money from other currencies as overspend", async () => {
    vi.mocked(budgetService.getExchangeStatus).mockResolvedValue({ expected: 1000, actual: 900 });
    render(
      <BudgetExchangeHint direction="in" amount="200" date="2026-11-04" currency="EUR" />
    );
    await waitFor(() => {
      expect(screen.getByText(/more than/)).toBeInTheDocument();
    });
    expect(screen.getByText(/more than/).className).toContain("text-income");
    expect(screen.queryByText(/over /)).not.toBeInTheDocument();
  });
});
