import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/dashboard" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({
    user: { firstName: "Ada", imageUrl: "", primaryEmailAddress: { emailAddress: "ada@example.com" } },
  }),
}));

vi.mock("@/lib/providers/ThemeProvider", () => ({
  useTheme: () => ({ preference: "light", resolved: "light", setPreference: vi.fn() }),
}));

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub;
});

import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("shows a sidebar on the app shell", () => {
    pathname.current = "/dashboard";
    render(<Navbar />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Dashboard" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Theme:/ })).toBeInTheDocument();
  });

  it("makes sidebar Settings fill the nav width", () => {
    pathname.current = "/dashboard";
    render(<Navbar />);
    const settings = screen
      .getAllByRole("link", { name: "Settings" })
      .find((link) => link.closest("aside"));
    expect(settings).toHaveClass("w-full");
  });

  it("closes the other header menu when one opens", async () => {
    pathname.current = "/dashboard";
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole("button", { name: /Theme:/ }));
    expect(screen.getByRole("menuitem", { name: "Light" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open profile menu" }));
    expect(screen.queryByRole("menuitem", { name: "Light" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Theme:/ }));
    expect(screen.queryByRole("menuitem", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Light" })).toBeInTheDocument();
  });

  it("opens More with the secondary pages", async () => {
    pathname.current = "/dashboard";
    const user = userEvent.setup();
    render(<Navbar />);
    await user.click(screen.getByRole("button", { name: "More" }));
    const more = screen.getByRole("navigation", { name: "Primary" });
    expect(more).toHaveTextContent("Accounts");
    expect(more).toHaveTextContent("Categories");
    expect(more).toHaveTextContent("Settings");
    expect(more).toHaveTextContent("Sign out");
  });

  it("is hidden on the login page", () => {
    pathname.current = "/login";
    const { container } = render(<Navbar />);
    expect(container).toBeEmptyDOMElement();
  });
});
