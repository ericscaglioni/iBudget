import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";

const { push, params } = vi.hoisted(() => ({
  push: vi.fn(),
  params: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params.current,
}));

import { Table } from "./Table";

const columns: ColumnDef<{ name: string }, unknown>[] = [
  { accessorKey: "name", header: "Name" },
];

describe("Table sorting", () => {
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
