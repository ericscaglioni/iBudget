import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { openModal, pathname } = vi.hoisted(() => ({
  openModal: vi.fn(),
  pathname: { current: "/accounts" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

vi.mock("@/lib/providers/TransactionModalProvider", () => ({
  useTransactionModal: () => ({ openModal, isLoading: false }),
}));

import { FloatingTransactionButton } from "./FloatingTransactionButton";

describe("FloatingTransactionButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pathname.current = "/accounts";
  });

  it("is labeled and shows a hint until it is used", async () => {
    render(<FloatingTransactionButton />);
    expect(screen.getByRole("button", { name: "New transaction" })).toBeInTheDocument();
    expect(await screen.findByText("Add a transaction from any page.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "New transaction" }));
    expect(openModal).toHaveBeenCalledOnce();
    expect(screen.queryByText("Add a transaction from any page.")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("ibudget:seen-new-transaction")).toBe("1");
  });

  it("lets the hint be dismissed without opening the form", async () => {
    render(<FloatingTransactionButton />);
    await screen.findByText("Add a transaction from any page.");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(openModal).not.toHaveBeenCalled();
    expect(screen.queryByText("Add a transaction from any page.")).not.toBeInTheDocument();
  });

  it("does not show on the login page", () => {
    pathname.current = "/login";
    const { container } = render(<FloatingTransactionButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not show the hint again after it was seen", async () => {
    window.localStorage.setItem("ibudget:seen-new-transaction", "1");
    render(<FloatingTransactionButton />);
    await waitFor(() => {
      expect(screen.queryByText("Add a transaction from any page.")).not.toBeInTheDocument();
    });
  });
});
