import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClientOnlyCurrency } from "./ClientOnlyCurrency";

describe("ClientOnlyCurrency", () => {
  it("formats the amount after mount", async () => {
    render(<ClientOnlyCurrency value={12.5} currency="USD" />);
    await waitFor(() => {
      expect(screen.getByText(/12\.50/)).toBeInTheDocument();
    });
  });
});
