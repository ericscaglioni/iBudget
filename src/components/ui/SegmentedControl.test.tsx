import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const options = [
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
];

describe("SegmentedControl", () => {
  it("calls onChange with the option that was pressed", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={options} value="expense" onChange={onChange} label="Type" />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Income" }));
    expect(onChange).toHaveBeenCalledWith("income");
  });
});
