import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/client/services", () => ({
  budgetService: { getCategoryStatus: vi.fn() },
}));

import { budgetService } from "@/lib/client/services";
import { BudgetHint } from "./BudgetHint";

describe("BudgetHint", () => {
  it("says how much is left of expected after the typed amount", async () => {
    vi.mocked(budgetService.getCategoryStatus).mockResolvedValue({ expected: 200, actual: 40 });
    render(<BudgetHint categoryId="food" amount="50" date="2026-11-04" currency="USD" />);
    await waitFor(() => {
      expect(screen.getByText(/left of/)).toBeInTheDocument();
    });
  });

  it("stays quiet when there is no plan", async () => {
    vi.mocked(budgetService.getCategoryStatus).mockResolvedValue({ expected: null, actual: 10 });
    const { container } = render(
      <BudgetHint categoryId="food" amount="50" date="2026-11-04" currency="USD" />,
    );
    await waitFor(() => expect(budgetService.getCategoryStatus).toHaveBeenCalled());
    expect(screen.queryByText(/left of/)).not.toBeInTheDocument();
    expect(screen.queryByText(/over expected/)).not.toBeInTheDocument();
    expect(container.querySelector("[aria-live='polite']")).toBeInTheDocument();
  });
});
