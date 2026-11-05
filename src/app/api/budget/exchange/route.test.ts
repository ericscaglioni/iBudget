import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  budgetService: { getExchangeStatus: vi.fn(), upsertExchangeExpected: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { budgetService } from "@/lib/server/services";
import { GET, PUT } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("GET /api/budget/exchange", () => {
  it("returns remaining pieces for a transfer", async () => {
    vi.mocked(budgetService.getExchangeStatus).mockResolvedValue({ expected: 3000, actual: 500 });
    const { status, body } = await readJson(
      await GET(makeRequest("/api/budget/exchange?yearMonth=2026-11&currency=EUR&direction=in"), routeContext())
    );
    expect(status).toBe(200);
    expect(body).toEqual({ data: { expected: 3000, actual: 500 } });
    expect(budgetService.getExchangeStatus).toHaveBeenCalledWith("u1", {
      yearMonth: "2026-11",
      currency: "EUR",
      direction: "in",
    });
  });
});

describe("PUT /api/budget/exchange", () => {
  it("saves an expected amount", async () => {
    vi.mocked(budgetService.upsertExchangeExpected).mockResolvedValue({ hasPlan: true } as never);
    const payload = { yearMonth: "2026-11", currency: "EUR", direction: "in", expectedAmount: 3000 };
    const { status, body } = await readJson(
      await PUT(makeRequest("/api/budget/exchange", { method: "PUT", body: payload }), routeContext())
    );
    expect(status).toBe(200);
    expect(body).toEqual({ data: { hasPlan: true } });
    expect(budgetService.upsertExchangeExpected).toHaveBeenCalledWith("u1", payload);
  });
});
