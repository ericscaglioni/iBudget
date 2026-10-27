import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Collapsible } from "./Collapsible";

describe("Collapsible", () => {
  it("keeps children mounted when closed, but not interactive", () => {
    render(
      <Collapsible open={false}>
        <button type="button">Inside</button>
      </Collapsible>
    );
    expect(screen.getByRole("button", { name: "Inside", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inside", hidden: true }).closest("[inert]")).not.toBeNull();
  });

  it("is interactive when open", () => {
    render(
      <Collapsible open>
        <button type="button">Inside</button>
      </Collapsible>
    );
    expect(screen.getByRole("button", { name: "Inside" })).toBeEnabled();
  });
});
