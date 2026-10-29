import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActiveFilters } from "./ActiveFilters";

const items = [
  { name: "type", label: "Type", display: "Expense" },
  { name: "month", label: "Month", display: "October 2026" },
];

describe("ActiveFilters", () => {
  it("does not render when nothing is selected", () => {
    const { container } = render(
      <ActiveFilters items={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("removes one filter or all of them", async () => {
    const onRemove = vi.fn();
    const onClearAll = vi.fn();
    render(<ActiveFilters items={items} onRemove={onRemove} onClearAll={onClearAll} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove Type filter" }));
    expect(onRemove).toHaveBeenCalledWith("type");

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearAll).toHaveBeenCalledOnce();
  });
});
