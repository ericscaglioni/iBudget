import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("shows a label when given one", () => {
    render(<Input label="Name" defaultValue="Wallet" />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Wallet")).toBeInTheDocument();
  });

  it("renders without a label", () => {
    render(<Input aria-label="Search" />);
    expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
  });
});
