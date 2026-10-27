import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("shows the title and description without an action", () => {
    render(<EmptyState title="No accounts" description="Add one to get started." />);
    expect(screen.getByRole("heading", { name: "No accounts" })).toBeInTheDocument();
    expect(screen.getByText("Add one to get started.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("runs the action when the button is pressed", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No accounts"
        description="Add one to get started."
        action={{ label: "New account", onClick }}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "New account" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
