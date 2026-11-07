import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

const setPreference = vi.fn();

vi.mock("@/lib/providers/ThemeProvider", () => ({
  useTheme: () => ({ preference: "light", resolved: "light", setPreference }),
}));

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub;
});

import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("offers Light, Dark and System", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole("button", { name: /Theme:/ }));
    expect(screen.getByRole("menuitem", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "System" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Dark" }));
    expect(setPreference).toHaveBeenCalledWith("dark");
  });
});
