import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TransactionTotals } from "./TransactionTotals";

const brl = { currency: "BRL", income: 20, expenses: 0, net: 20 };
const usd = { currency: "USD", income: 100, expenses: 40, net: 60 };
const eur = { currency: "EUR", income: 50, expenses: 10, net: 40 };

describe("TransactionTotals", () => {
  it("does not render when there is nothing to add up", () => {
    const { container } = render(<TransactionTotals totals={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a labelled summary with right-aligned columns", () => {
    render(<TransactionTotals totals={[usd]} />);

    expect(screen.getByRole("heading", { name: "Totals for these filters" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Income" })).toHaveClass("text-right");
    expect(screen.getByRole("columnheader", { name: "Expenses" })).toHaveClass("text-right");
    expect(screen.getByRole("columnheader", { name: "Net" })).toHaveClass("text-right");
    screen.getAllByRole("cell").forEach((cell) => {
      expect(cell.firstElementChild).toHaveClass("truncate");
    });
    expect(screen.queryByRole("button", { name: "View all" })).not.toBeInTheDocument();
  });

  it("keeps extra currencies collapsed until View all is clicked", async () => {
    render(<TransactionTotals totals={[brl, usd]} preferredCurrency="USD" />);

    expect(screen.getByRole("rowheader", { name: "USD" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "BRL", hidden: true })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "View all" }));
    expect(screen.getByRole("rowheader", { name: "BRL" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getByRole("rowheader", { name: "BRL", hidden: true })).toBeInTheDocument();
  });

  it("puts the preferred currency in the visible row", () => {
    render(<TransactionTotals totals={[brl, eur, usd]} preferredCurrency="EUR" />);
    expect(screen.getByRole("rowheader", { name: "EUR" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "BRL", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "USD", hidden: true })).toBeInTheDocument();
  });
});
