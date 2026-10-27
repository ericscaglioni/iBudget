import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteModal } from "./DeleteModal";

vi.mock("@/lib/utils/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { showError, showSuccess } from "@/lib/utils/toast";

describe("DeleteModal", () => {
  it("toasts success after a delete", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <DeleteModal
        open
        onClose={() => undefined}
        onDelete={onDelete}
        modelName="Account"
        itemDescription="Wallet"
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(showSuccess).toHaveBeenCalledWith("Account deleted successfully");
  });

  it("toasts the error message when delete fails", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("Cannot delete account with existing transactions"));
    render(
      <DeleteModal
        open
        onClose={() => undefined}
        onDelete={onDelete}
        modelName="Account"
        itemDescription="Wallet"
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(showError).toHaveBeenCalledWith("Cannot delete account with existing transactions");
  });
});
