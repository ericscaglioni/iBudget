import { AppError } from "@/lib/errors/AppError";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FormModal } from "./FormModal";
import { FormTextInput } from "./FormTextInput";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

vi.mock("@/lib/utils/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { showError, showSuccess } from "@/lib/utils/toast";

type FormValues = { name: string };

const Harness = ({
  onSubmit,
  isLoading,
  secondaryAction,
}: {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading?: boolean;
  secondaryAction?: { label: string; onSubmit: (data: FormValues) => Promise<void> };
}) => {
  const form = useForm<FormValues>({ defaultValues: { name: "Wallet" } });
  useEffect(() => {
    form.setValue("name", "Checking", { shouldDirty: true });
  }, [form]);
  return (
    <FormModal
      form={form}
      open
      onSubmit={onSubmit}
      onClose={() => undefined}
      title="Edit account"
      isLoading={isLoading}
      secondaryAction={secondaryAction}
    >
      <FormTextInput form={form} name="name" label="Name" />
    </FormModal>
  );
};

describe("FormModal", () => {
  it("saves, refreshes and toasts success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<Harness onSubmit={onSubmit} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Checking" }));
    expect(refresh).toHaveBeenCalled();
    expect(showSuccess).toHaveBeenCalledWith("Operation successful");
  });

  it("toasts an AppError message when save fails", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new AppError("Name is taken", 400));
    render(<Harness onSubmit={onSubmit} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Save" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(showError).toHaveBeenCalledWith("Name is taken"));
  });

  it("keeps Save disabled while the form is still loading", () => {
    render(<Harness onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Loading...");
  });

  it("runs the secondary action", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onSecondary = vi.fn().mockResolvedValue(undefined);
    render(
      <Harness
        onSubmit={onSubmit}
        secondaryAction={{ label: "Save & add another", onSubmit: onSecondary }}
      />
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Save & add another" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "Save & add another" }));
    await waitFor(() => expect(onSecondary).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
