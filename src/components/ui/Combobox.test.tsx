import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { Combobox } from "./Combobox";

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
});
