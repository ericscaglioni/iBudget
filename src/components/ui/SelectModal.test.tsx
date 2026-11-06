import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SelectModal } from "./SelectModal";

const mixedAccounts = [
  { label: "N26", value: "1", currency: "EUR" },
  { label: "Wise", value: "2", currency: "USD" },
];

describe("SelectModal", () => {
  it("shows the currency next to each account when options use more than one", () => {
    render(
      <SelectModal
        isOpen
        onClose={() => undefined}
        title="Select Option"
        options={mixedAccounts}
        value=""
        onChange={() => undefined}
      />
    );
    expect(screen.getByRole("button", { name: /N26/ })).toHaveTextContent("EUR");
    expect(screen.getByRole("button", { name: /Wise/ })).toHaveTextContent("USD");
  });

  it("hides the currency when every option is the same currency", () => {
    render(
      <SelectModal
        isOpen
        onClose={() => undefined}
        title="Select Option"
        options={[
          { label: "N26", value: "1", currency: "EUR" },
          { label: "Revolut", value: "2", currency: "EUR" },
        ]}
        value=""
        onChange={() => undefined}
      />
    );
    expect(screen.getByRole("button", { name: "N26" })).toBeInTheDocument();
    expect(screen.queryByText("EUR")).not.toBeInTheDocument();
  });

  it("filters by currency code as well as name", async () => {
    const user = userEvent.setup();
    render(
      <SelectModal
        isOpen
        onClose={() => undefined}
        title="Select Option"
        options={mixedAccounts}
        value=""
        onChange={() => undefined}
      />
    );
    await user.type(screen.getByPlaceholderText("Search options..."), "usd");
    expect(screen.getByRole("button", { name: /Wise/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /N26/ })).not.toBeInTheDocument();
  });
});
