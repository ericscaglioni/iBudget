import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PageShell } from "./PageShell";

describe("PageShell", () => {
  it("renders the title, subtitle and children", () => {
    render(
      <PageShell title="Accounts" subtitle="Your wallets">
        <p>List</p>
      </PageShell>
    );
    expect(screen.getByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.getByText("Your wallets")).toBeInTheDocument();
    expect(screen.getByText("List")).toBeInTheDocument();
  });

  it("shows an action button when given one", async () => {
    const onClick = vi.fn();
    render(
      <PageShell title="Accounts" actionButton={{ text: "New account", onClick }}>
        <p>List</p>
      </PageShell>
    );
    await userEvent.click(screen.getByRole("button", { name: "New account" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
