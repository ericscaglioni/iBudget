import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip } from "./Chip";

describe("Chip", () => {
  it("shows the label on the given colour", () => {
    render(<Chip label="Food" color="#10B981" />);
    const chip = screen.getByText("Food").parentElement?.parentElement;
    expect(chip).toHaveStyle({ backgroundColor: "#10B981" });
  });

  it("renders an optional icon", () => {
    render(<Chip label="Food" color="#10B981" icon={<span>🥗</span>} />);
    expect(screen.getByText("🥗")).toBeInTheDocument();
  });
});
