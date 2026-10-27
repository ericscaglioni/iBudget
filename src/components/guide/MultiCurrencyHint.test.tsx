import { AppError } from "@/lib/errors/AppError";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { push, refresh, dismissTip } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  dismissTip: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/client/services", () => ({
  guideService: { dismissTip },
}));

vi.mock("@/lib/utils/toast", () => ({
  showError: vi.fn(),
}));

import { showError } from "@/lib/utils/toast";
import { MultiCurrencyHint } from "./MultiCurrencyHint";

describe("MultiCurrencyHint", () => {
  it("links to settings", async () => {
    render(<MultiCurrencyHint currency="USD" currencies={["USD", "BRL"]} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose default currency" }));
    expect(push).toHaveBeenCalledWith("/settings");
  });

  it("dismisses the tip", async () => {
    dismissTip.mockResolvedValueOnce(undefined);
    render(<MultiCurrencyHint currency="USD" currencies={["USD", "EUR"]} />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss tip" }));
    await waitFor(() => expect(dismissTip).toHaveBeenCalledWith("multi-currency"));
    expect(refresh).toHaveBeenCalled();
  });

  it("toasts when dismiss fails", async () => {
    dismissTip.mockRejectedValueOnce(new AppError("nope"));
    render(<MultiCurrencyHint currency="USD" currencies={["USD", "EUR"]} />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss tip" }));
    await waitFor(() => expect(showError).toHaveBeenCalledWith("nope"));
  });
});
