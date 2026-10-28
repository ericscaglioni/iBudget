import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("shows the title, description and children when open", () => {
    render(
      <Modal open onClose={() => undefined} title="Edit account" description="Change the name">
        <p>Form fields</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog", { name: "Edit account" });
    expect(dialog).toBeInTheDocument();
    expect(dialog.querySelector(".overflow-x-hidden")).not.toBeNull();
    expect(screen.getByText("Change the name")).toBeInTheDocument();
    expect(screen.getByText("Form fields")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Modal open={false} onClose={() => undefined} title="Edit account">
        <p>Form fields</p>
      </Modal>
    );
    expect(screen.queryByText("Edit account")).not.toBeInTheDocument();
  });

  it("closes from the X button", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Edit account">
        <p>Form fields</p>
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("is a card on a phone, and only fills the screen when asked", () => {
    const { rerender } = render(
      <Modal open onClose={() => undefined} title="Delete account">
        <p>Are you sure?</p>
      </Modal>
    );
    expect(screen.getByRole("dialog").querySelector(".rounded-none")).toBeNull();

    rerender(
      <Modal open onClose={() => undefined} title="New Transaction" fullScreenOnMobile>
        <p>Form fields</p>
      </Modal>
    );
    expect(screen.getByRole("dialog").querySelector(".rounded-none")).not.toBeNull();
  });
});
