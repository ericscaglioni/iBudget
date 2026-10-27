import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioGroup } from "./RadioGroup";

const options = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
];

describe("RadioGroup", () => {
  it("marks the current value and reports a change", async () => {
    const onChange = vi.fn();
    render(<RadioGroup name="type" options={options} value="cash" onChange={onChange} />);
    expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Card" }));
    expect(onChange).toHaveBeenCalledWith("card");
  });
});
