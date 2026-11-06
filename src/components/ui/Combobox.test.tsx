import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { Combobox, optionDisplayValue, optionMatchesQuery, optionsShowCurrency } from "./Combobox";

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub;
});

const options = [{ label: "Wallet", value: "wallet" }];

const setInnerWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  window.dispatchEvent(new Event("resize"));
};

describe("Combobox", () => {
  it("shows the field label only once on a phone", async () => {
    setInnerWidth(375);
    render(
      <Combobox
        label="Account"
        options={options}
        value=""
        onChange={() => undefined}
        placeholder="Select an option"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Select an option/ })).toBeInTheDocument();
    });
    expect(screen.getAllByText("Account")).toHaveLength(1);
  });

  it("shows the field label once on desktop", () => {
    setInnerWidth(1024);
    render(
      <Combobox
        label="Category"
        options={options}
        value=""
        onChange={() => undefined}
        placeholder="Select an option"
      />
    );
    expect(screen.getAllByText("Category")).toHaveLength(1);
  });

  it("marks a required field with an asterisk", () => {
    setInnerWidth(1024);
    render(
      <Combobox
        label="Category"
        required
        options={options}
        value=""
        onChange={() => undefined}
      />
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows the currency in the closed field when options use more than one", () => {
    setInnerWidth(1024);
    render(
      <Combobox
        options={[
          { label: "N26", value: "1", currency: "EUR" },
          { label: "Wise", value: "2", currency: "USD" },
        ]}
        value="1"
        onChange={() => undefined}
      />
    );
    expect(screen.getByRole("combobox")).toHaveValue("N26 · EUR");
  });

  it("hides the currency in the closed field when every option is the same currency", () => {
    setInnerWidth(1024);
    render(
      <Combobox
        options={[
          { label: "N26", value: "1", currency: "EUR" },
          { label: "Revolut", value: "2", currency: "EUR" },
        ]}
        value="1"
        onChange={() => undefined}
      />
    );
    expect(screen.getByRole("combobox")).toHaveValue("N26");
  });

  it("lists the currency next to each account when options use more than one", async () => {
    setInnerWidth(1024);
    const user = userEvent.setup();
    render(
      <Combobox
        options={[
          { label: "N26", value: "1", currency: "EUR" },
          { label: "Wise", value: "2", currency: "USD" },
        ]}
        value=""
        onChange={() => undefined}
        placeholder="Select an account"
      />
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("option", { name: /N26/ })).toHaveTextContent("EUR");
    expect(screen.getByRole("option", { name: /Wise/ })).toHaveTextContent("USD");
  });

  it("does not list the currency when every option is the same currency", async () => {
    setInnerWidth(1024);
    const user = userEvent.setup();
    render(
      <Combobox
        options={[
          { label: "N26", value: "1", currency: "EUR" },
          { label: "Revolut", value: "2", currency: "EUR" },
        ]}
        value=""
        onChange={() => undefined}
        placeholder="Select an account"
      />
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("option", { name: "N26" })).toBeInTheDocument();
    expect(screen.queryByText("EUR")).not.toBeInTheDocument();
  });

  it("shows the currency on the phone trigger when options use more than one", async () => {
    setInnerWidth(375);
    render(
      <Combobox
        options={[
          { label: "N26", value: "1", currency: "EUR" },
          { label: "Wise", value: "2", currency: "USD" },
        ]}
        value="1"
        onChange={() => undefined}
      />
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /N26/ })).toHaveTextContent("EUR");
    });
  });

  it("filters by currency code as well as name", async () => {
    setInnerWidth(1024);
    const user = userEvent.setup();
    render(
      <Combobox
        options={[
          { label: "N26", value: "1", currency: "EUR" },
          { label: "Wise", value: "2", currency: "USD" },
        ]}
        value=""
        onChange={() => undefined}
        placeholder="Select an account"
      />
    );
    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "eur");
    expect(screen.getByRole("option", { name: /N26/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Wise/ })).not.toBeInTheDocument();
  });
});

describe("combobox currency helpers", () => {
  it("shows currency only when more than one is present", () => {
    expect(
      optionsShowCurrency([
        { label: "N26", value: "1", currency: "EUR" },
        { label: "Wise", value: "2", currency: "USD" },
      ])
    ).toBe(true);
    expect(
      optionsShowCurrency([
        { label: "N26", value: "1", currency: "EUR" },
        { label: "Revolut", value: "2", currency: "EUR" },
      ])
    ).toBe(false);
    expect(optionsShowCurrency([{ label: "Groceries", value: "1" }])).toBe(false);
  });

  it("formats the closed-field label with a quieter code", () => {
    expect(optionDisplayValue({ label: "N26", value: "1", currency: "EUR" }, true)).toBe("N26 · EUR");
    expect(optionDisplayValue({ label: "N26", value: "1", currency: "EUR" }, false)).toBe("N26");
  });

  it("matches a query against the name or the currency code", () => {
    const n26 = { label: "N26", value: "1", currency: "EUR" };
    expect(optionMatchesQuery(n26, "n2")).toBe(true);
    expect(optionMatchesQuery(n26, "eur")).toBe(true);
    expect(optionMatchesQuery(n26, "usd")).toBe(false);
  });
});
