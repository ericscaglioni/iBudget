import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import packageJson from "../../package.json";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/dashboard" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { AppFooter } from "./AppFooter";

describe("AppFooter", () => {
  it("shows the current app version", () => {
    pathname.current = "/dashboard";
    render(<AppFooter />);
    expect(screen.getByText(`iBudget ${packageJson.version}`)).toBeInTheDocument();
  });

  it("is hidden on the login page", () => {
    pathname.current = "/login";
    const { container } = render(<AppFooter />);
    expect(container).toBeEmptyDOMElement();
  });
});
