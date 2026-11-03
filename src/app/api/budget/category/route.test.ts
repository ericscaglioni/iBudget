import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  budgetService: { getCategoryStatus: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { budgetService } from "@/lib/server/services";
import { GET } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("GET /api/budget/category", () => {
  it("returns expected and actual for a category", async () => {
    vi.mocked(budgetService.getCategoryStatus).mockResolvedValue({ expected: 200, actual: 40 });
    const { status, body } = await readJson(
      await GET(
        makeRequest("/api/budget/category?categoryId=food&yearMonth=2026-11&currency=USD"),
        routeContext()
      )
    );
    expect(status).toBe(200);
    expect(body).toEqual({ data: { expected: 200, actual: 40 } });
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect(
      (await GET(makeRequest("/api/budget/category?categoryId=food"), routeContext())).status
    ).toBe(401);
  });
});
