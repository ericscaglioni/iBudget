import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { TopSpendingCategories } from "./TopSpendingCategories";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});

vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 220, height: 220 }}>{children}</div>
    ),
  };
});

const food = { categoryId: "food", categoryName: "Food", amount: 80, color: "#f00" };
const rent = { categoryId: "rent", categoryName: "Rent", amount: 20, color: "#00f" };

describe("TopSpendingCategories", () => {
  it("shows an empty state when there is nothing spent", () => {
    render(<TopSpendingCategories categories={[]} currency="USD" />);
    expect(screen.getByText("No spending data available for this period.")).toBeInTheDocument();
  });

  it("shows a donut legend with amounts, shares, and the month total", async () => {
    render(<TopSpendingCategories categories={[food, rent]} currency="USD" />);

    expect(screen.getByRole("heading", { name: "Spending this month" })).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
  });

  it("does not make the donut keyboard-focusable", () => {
    const { container } = render(
      <TopSpendingCategories categories={[food, rent]} currency="USD" />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("tabindex")).not.toBe("0");
  });

  it("folds extra categories into Other", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      categoryId: `c${i}`,
      categoryName: `Cat ${i}`,
      amount: 10 - i,
      color: "#111",
    }));
    render(<TopSpendingCategories categories={many} currency="EUR" />);
    expect(screen.getByText("Other")).toBeInTheDocument();
  });
});
