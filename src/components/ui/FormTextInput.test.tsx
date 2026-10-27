import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { FormTextInput } from "./FormTextInput";

type FormValues = { name: string };

const Harness = ({ error, hint }: { error?: string; hint?: string }) => {
  const form = useForm<FormValues>({ defaultValues: { name: "" } });
  useEffect(() => {
    if (error) {
      form.setError("name", { type: "manual", message: error });
    }
  }, [error, form]);
  return <FormTextInput form={form} name="name" label="Name" hint={hint} />;
};

describe("FormTextInput", () => {
  it("shows hint text when there is no error", () => {
    render(<Harness hint="3 characters or more" />);
    expect(screen.getByText("3 characters or more")).toBeInTheDocument();
  });

  it("replaces the hint with the error", async () => {
    render(<Harness hint="3 characters or more" error="Name is required" />);
    await waitFor(() => expect(screen.getByText("Name is required")).toBeInTheDocument());
    expect(screen.queryByText("3 characters or more")).not.toBeInTheDocument();
  });
});
