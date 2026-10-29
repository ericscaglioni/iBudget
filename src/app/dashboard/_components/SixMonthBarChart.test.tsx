import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SixMonthBarChart } from "./SixMonthBarChart";

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 320 }}>{children}</div>
    ),
  };
});

describe("SixMonthBarChart", () => {
  it("labels months from YYYY-MM without Invalid Date", () => {
    render(
      <SixMonthBarChart
        data={[{ month: "2026-10", income: 100, expenses: 40 }]}
        currency="USD"
      />
    );
    expect(screen.getByText(/6-Month Trend/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/i)).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no months", () => {
    render(<SixMonthBarChart data={[]} currency="USD" />);
    expect(screen.getByText("No data available for these months")).toBeInTheDocument();
  });
});
