import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { ColorInput } from "./ColorInput";

type FormValues = { color: string };

const Harness = ({ error, required }: { error?: string; required?: boolean }) => {
  const form = useForm<FormValues>({ defaultValues: { color: "#10B981" } });
  useEffect(() => {
    if (error) {
      form.setError("color", { type: "manual", message: error });
    }
  }, [error, form]);
  return <ColorInput form={form} name="color" label="Colour" required={required} />;
};

describe("ColorInput", () => {
  it("renders a colour picker", () => {
    const { container } = render(<Harness />);
    expect(screen.getByText("Colour")).toBeInTheDocument();
    expect(container.querySelector("input[type='color']")).toBeTruthy();
  });

  it("shows a validation error", async () => {
    render(<Harness error="Color is required" />);
    await waitFor(() => expect(screen.getByText("Color is required")).toBeInTheDocument());
  });

  it("marks a required field with an asterisk", () => {
    render(<Harness required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
