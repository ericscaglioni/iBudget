import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  transactionService: { updateTransaction: vi.fn(), updateTransferTransaction: vi.fn(), deleteTransaction: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { transactionService } from "@/lib/server/services";
import { DELETE, PATCH } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const patch = (body: unknown) => PATCH(makeRequest("/api/transactions/t1", { method: "PATCH", body }), routeContext({ id: "t1" }));
const remove = (query = "") => DELETE(makeRequest(`/api/transactions/t1${query}`, { method: "DELETE" }), routeContext({ id: "t1" }));

const edit = { type: "expense", amount: 30, accountId: "a1", categoryId: "c1", description: "New", date: "2026-10-21" };

beforeEach(() => {
  mockAuth.mockResolvedValue({ userId: "u1" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PATCH /api/transactions/[id]", () => {
  it("updates a regular transaction", async () => {
    vi.mocked(transactionService.updateTransaction).mockResolvedValue({ id: "t1" } as never);

    const { status, body } = await readJson(await patch(edit));

    expect(status).toBe(200);
    expect(body).toEqual({ data: { id: "t1" } });
    expect(transactionService.updateTransaction).toHaveBeenCalledWith(
      "u1",
      { id: "t1", type: "expense", amount: 30, accountId: "a1", categoryId: "c1", description: "New", date: "2026-10-21" },
      undefined
    );
    expect(transactionService.updateTransferTransaction).not.toHaveBeenCalled();
  });

  it("passes the scope on when the whole recurring series is updated", async () => {
    vi.mocked(transactionService.updateTransaction).mockResolvedValue({ count: 3 } as never);
    await patch({ ...edit, updateScope: "future" });
    expect(vi.mocked(transactionService.updateTransaction).mock.calls[0][2]).toEqual({ updateScope: "future" });
  });

  it("updates both sides of a transfer when the transaction is one", async () => {
    vi.mocked(transactionService.updateTransferTransaction).mockResolvedValue({ transferId: "tr1" } as never);

    const { status } = await readJson(
      await patch({ transferId: "tr1", fromAccountId: "usd", toAccountId: "brl", amount: 100, toAmount: 520, description: "Move", date: "2026-10-21" })
    );

    expect(status).toBe(200);
    expect(transactionService.updateTransferTransaction).toHaveBeenCalledWith("u1", {
      id: "t1",
      fromAccountId: "usd",
      toAccountId: "brl",
      amount: 100,
      toAmount: 520,
      description: "Move",
      date: "2026-10-21",
    });
    expect(transactionService.updateTransaction).not.toHaveBeenCalled();
  });

  it("answers 400 for a scope it does not know", async () => {
    const { status } = await readJson(await patch({ ...edit, updateScope: "all" }));
    expect(status).toBe(400);
    expect(transactionService.updateTransaction).not.toHaveBeenCalled();
  });

  it.each([
    ["Transaction not found", 404],
    ["Cannot update future transactions: transaction is not recurring", 400],
    ["Cannot update future transactions: transaction date is missing", 400],
  ])("answers %s with status %i", async (message, expectedStatus) => {
    vi.mocked(transactionService.updateTransaction).mockRejectedValue(new Error(message));
    const { status, body } = await readJson(await patch(edit));
    expect(status).toBe(expectedStatus);
    expect(body.error).toEqual(expect.any(String));
  });

  it("does not hide errors it does not know about", async () => {
    vi.mocked(transactionService.updateTransaction).mockRejectedValue(new Error("database exploded"));
    await expect(patch(edit)).rejects.toThrow("database exploded");
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await patch(edit)).status).toBe(401);
    expect(transactionService.updateTransaction).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/transactions/[id]", () => {
  it("deletes one transaction and answers 204", async () => {
    const response = await remove();
    expect(response.status).toBe(204);
    expect(transactionService.deleteTransaction).toHaveBeenCalledWith("u1", "t1", undefined);
  });

  it("deletes this and the following occurrences with scope=future", async () => {
    const response = await remove("?scope=future");
    expect(response.status).toBe(204);
    expect(transactionService.deleteTransaction).toHaveBeenCalledWith("u1", "t1", { scope: "future" });
  });

  it("answers 400 for a scope it does not know", async () => {
    const { status } = await readJson(await remove("?scope=all"));
    expect(status).toBe(400);
    expect(transactionService.deleteTransaction).not.toHaveBeenCalled();
  });

  it.each([
    ["Transaction not found", 404],
    ["Cannot delete future transactions: transaction is not recurring", 400],
  ])("answers %s with status %i", async (message, expectedStatus) => {
    vi.mocked(transactionService.deleteTransaction).mockRejectedValue(new Error(message));
    expect((await remove()).status).toBe(expectedStatus);
  });

  it("does not hide errors it does not know about", async () => {
    vi.mocked(transactionService.deleteTransaction).mockRejectedValue(new Error("database exploded"));
    await expect(remove()).rejects.toThrow("database exploded");
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await remove()).status).toBe(401);
    expect(transactionService.deleteTransaction).not.toHaveBeenCalled();
  });
});
