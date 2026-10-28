import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmationModal } from "./ConfirmationModal";

describe("ConfirmationModal", () => {
  it("confirms and then closes", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmationModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete account"
        description="This cannot be undone"
        confirmLabel="Delete"
        confirmVariant="danger"
      />
    );
    expect(screen.getByRole("dialog").querySelector(".rounded-none")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes from Cancel without confirming", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmationModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete account"
        description="This cannot be undone"
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows a loading state and stays open if confirm fails", async () => {
    let rejectConfirm: (error: Error) => void = () => undefined;
    const onConfirm = vi.fn(
      () => new Promise<void>((_resolve, reject) => {
        rejectConfirm = reject;
      })
    );
    const onClose = vi.fn();
    render(
      <ConfirmationModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete account"
        description="This cannot be undone"
        confirmLabel="Delete"
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    rejectConfirm(new Error("still in use"));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
