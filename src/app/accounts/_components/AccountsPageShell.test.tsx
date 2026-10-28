import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, replace, refresh, searchParams } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
  useSearchParams: () => searchParams,
}));

vi.mock("./AccountsTable", () => ({
  AccountsTable: () => <div>accounts table</div>,
}));

vi.mock("./AccountFormModal", () => ({
  AccountFormModal: ({
    open,
    onClose,
    onCreate,
    description,
  }: {
    open: boolean;
    onClose: () => void;
    onCreate?: (account: { id: string; name: string; currency: string }) => void;
    description?: string;
  }) =>
    open ? (
      <div>
        {description && <p>{description}</p>}
        <button
          type="button"
          onClick={() => {
            onCreate?.({ id: "1", name: "Cash", currency: "USD" });
            onClose();
          }}
        >
          finish create
        </button>
        <button type="button" onClick={onClose}>
          cancel
        </button>
      </div>
    ) : null,
}));

import { AccountsPageShell } from "./AccountsPageShell";

describe("AccountsPageShell", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
    searchParams.delete("new");
  });

  it("returns to the dashboard after creating the guided first account", async () => {
    searchParams.set("new", "1");
    render(<AccountsPageShell accounts={[]} totalCount={0} page={1} pageSize={20} />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard will show you what to do next/)).toBeInTheDocument();
    });
    expect(replace).toHaveBeenCalledWith("/accounts");

    await userEvent.click(screen.getByRole("button", { name: "finish create" }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("stays on accounts when creating from the empty state, not the guide", async () => {
    render(<AccountsPageShell accounts={[]} totalCount={0} page={1} pageSize={20} />);

    await userEvent.click(screen.getByRole("button", { name: "Create your first account" }));
    await userEvent.click(screen.getByRole("button", { name: "finish create" }));

    expect(push).not.toHaveBeenCalled();
  });

  it("does not leave the accounts page if the guided form is cancelled", async () => {
    searchParams.set("new", "1");
    render(<AccountsPageShell accounts={[]} totalCount={0} page={1} pageSize={20} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "cancel" })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("button", { name: "cancel" }));

    expect(push).not.toHaveBeenCalled();
  });
});
