import { AppError } from "@/lib/errors/AppError";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { push, refresh, openModal, dismissTip } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  openModal: vi.fn(),
  dismissTip: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/providers/TransactionModalProvider", () => ({
  useTransactionModal: () => ({ openModal }),
}));

vi.mock("@/lib/client/services", () => ({
  guideService: { dismissTip },
}));

vi.mock("@/lib/utils/toast", () => ({
  showError: vi.fn(),
}));

import { showError } from "@/lib/utils/toast";
import { GettingStarted } from "./GettingStarted";

describe("GettingStarted", () => {
  it("sends the user to create an account", async () => {
    render(
      <GettingStarted
        canDismiss={false}
        steps={[
          { id: "create-account", done: false },
          { id: "add-transaction", done: false },
        ]}
      />
    );
    expect(screen.queryByRole("button", { name: "Hide" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(push).toHaveBeenCalledWith("/accounts?new=1");
  });

  it("opens the transaction modal on the second step", async () => {
    render(
      <GettingStarted
        canDismiss
        steps={[
          { id: "create-account", done: true },
          { id: "add-transaction", done: false },
        ]}
      />
    );
    expect(screen.getByText(/New transaction at the bottom right/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add transaction" }));
    expect(openModal).toHaveBeenCalledOnce();
  });

  it("hides the guide and toasts when dismiss fails", async () => {
    dismissTip.mockResolvedValueOnce(undefined);
    render(
      <GettingStarted
        canDismiss
        steps={[
          { id: "create-account", done: true },
          { id: "add-transaction", done: true },
        ]}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    await waitFor(() => expect(dismissTip).toHaveBeenCalledWith("checklist"));
    expect(refresh).toHaveBeenCalled();

    dismissTip.mockRejectedValueOnce(new AppError("nope"));
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));
    await waitFor(() => expect(showError).toHaveBeenCalledWith("nope"));
  });
});
