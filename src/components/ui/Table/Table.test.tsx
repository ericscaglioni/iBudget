import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";

const { push, params, transition } = vi.hoisted(() => ({
  push: vi.fn(),
  params: { current: new URLSearchParams() },
  transition: { pending: false },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.current,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useTransition: () =>
      [transition.pending, (callback: () => void) => callback()] as const,
  };
});

import { Table } from "./Table";

const columns: ColumnDef<{ name: string }, unknown>[] = [
  { accessorKey: "name", header: "Name" },
];

describe("Table sorting", () => {
  beforeEach(() => {
    transition.pending = false;
    params.current = new URLSearchParams();
    push.mockClear();
  });

  it("shows a loading overlay on the table while a filter or sort is pending", () => {
    transition.pending = true;
    render(
      <Table data={[{ name: "Wallet" }]} columns={columns} enableSorting basePath="/accounts" />
    );
    const overlay = screen.getByRole("status", { name: "Loading" });
    expect(overlay).toBeInTheDocument();
    expect(overlay.parentElement).toContainElement(screen.getByRole("table"));
  });

  it("shows the same overlay when a parent says filtering is in progress", () => {
    render(
      <Table
        data={[{ name: "Wallet" }]}
        columns={columns}
        enableSorting
        basePath="/accounts"
        isFiltering
      />
    );
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("shows sortable headers as buttons and cycles the sort in the URL", async () => {
    params.current = new URLSearchParams();
    render(
      <Table data={[{ name: "Wallet" }]} columns={columns} enableSorting basePath="/accounts" />
    );

    const header = screen.getByRole("button", { name: /Name/ });
    expect(header).toBeInTheDocument();
    expect(header.closest("th")).toHaveAttribute("aria-sort", "none");

    await userEvent.click(header);
    expect(push).toHaveBeenCalledWith("/accounts?sortField=name&sortOrder=asc");
  });
});
