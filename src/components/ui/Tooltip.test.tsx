import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub;
});

describe("Tooltip", () => {
  it("hides the explanation until the trigger is pressed", async () => {
    render(
      <Tooltip content="Compared with October, not a spending target.">
        <span>▼ 91% vs. Oct</span>
      </Tooltip>
    );

    expect(screen.queryByText(/not a spending target/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /91% vs. Oct/ }));
    expect(screen.getByText(/not a spending target/)).toBeInTheDocument();
  });
});
