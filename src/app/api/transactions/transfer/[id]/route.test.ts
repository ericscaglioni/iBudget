import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({ transactionService: { getTransferTransactionByTransferId: vi.fn() } }));

import { auth } from "@clerk/nextjs/server";
import { transactionService } from "@/lib/server/services";
import { GET } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const get = () => GET(makeRequest("/api/transactions/transfer/tr1"), routeContext({ id: "tr1" }));

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("GET /api/transactions/transfer/[id]", () => {
  it("returns the received side of the user's transfer", async () => {
    vi.mocked(transactionService.getTransferTransactionByTransferId).mockResolvedValue({ id: "in1" } as never);
    const { status, body } = await readJson(await get());
    expect(status).toBe(200);
    expect(body).toEqual({ data: { id: "in1" } });
    expect(transactionService.getTransferTransactionByTransferId).toHaveBeenCalledWith({ transferId: "tr1", userId: "u1" });
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await get()).status).toBe(401);
    expect(transactionService.getTransferTransactionByTransferId).not.toHaveBeenCalled();
  });
});
