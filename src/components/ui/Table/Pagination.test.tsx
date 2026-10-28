import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/ui", async () => {
  const actual = await vi.importActual<typeof import("@/components/ui")>("@/components/ui");
  return {
    ...actual,
    Combobox: ({
      value,
      onChange,
      options,
    }: {
      value: string;
      onChange: (value: string) => void;
      options: { label: string; value: string }[];
    }) => (
      <select aria-label="Rows per page" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("fits on one row, with Previous/Next words only for larger screens", () => {
    const { container } = render(
      <Pagination page={1} pageCount={3} pageSize={20} searchParams={new URLSearchParams("sort=date")} basePath="/transactions" />
    );
    expect(container.firstElementChild).toHaveClass("flex", "items-center", "justify-between");
    expect(screen.getByText("Previous")).toHaveClass("hidden", "sm:inline");
    expect(screen.getByText("Next")).toHaveClass("hidden", "sm:inline");
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("disables Previous on the first page and advances with Next", async () => {
    render(
      <Pagination page={1} pageCount={3} pageSize={20} searchParams={new URLSearchParams("sort=date")} basePath="/transactions" />
    );
    expect(screen.getByRole("button", { name: /Previous/ })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(push).toHaveBeenCalledWith("/transactions?sort=date&page=2");
  });

  it("resets to the first page when the page size changes", async () => {
    render(
      <Pagination page={2} pageCount={4} pageSize={20} searchParams={new URLSearchParams("page=2")} basePath="/accounts" />
    );
    await userEvent.selectOptions(screen.getByLabelText("Rows per page"), "50");
    expect(push).toHaveBeenCalledWith("/accounts?pageSize=50");
  });
});
