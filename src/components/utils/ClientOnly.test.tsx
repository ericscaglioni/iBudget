import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClientOnly } from "./ClientOnly";

describe("ClientOnly", () => {
  it("renders children after mount", () => {
    render(
      <ClientOnly>
        <span>Ready</span>
      </ClientOnly>
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
