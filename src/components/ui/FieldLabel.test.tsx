import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldLabel } from "./FieldLabel";

describe("FieldLabel", () => {
  it("marks required fields with an asterisk", () => {
    render(<FieldLabel required>Amount</FieldLabel>);
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("(required)")).toHaveClass("sr-only");
  });

  it("does not mark optional fields", () => {
    render(<FieldLabel>End Date</FieldLabel>);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });
});
