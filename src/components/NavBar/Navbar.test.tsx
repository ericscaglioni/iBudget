import { render, screen } from "@testing-library/react";
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
  it("pins the bar to the top of the viewport", () => {
    pathname.current = "/dashboard";
    render(<Navbar />);
    expect(screen.getByRole("navigation")).toHaveClass("fixed", "top-0");
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("is hidden on the login page", () => {
    pathname.current = "/login";
    const { container } = render(<Navbar />);
    expect(container).toBeEmptyDOMElement();
  });
});
