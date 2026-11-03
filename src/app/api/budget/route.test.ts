import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  budgetService: { getBudget: vi.fn(), upsertExpected: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { budgetService } from "@/lib/server/services";
import { GET, PUT } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("GET /api/budget", () => {
  it("returns the month's plan", async () => {
    vi.mocked(budgetService.getBudget).mockResolvedValue({ yearMonth: "2026-11" } as never);
    const { status, body } = await readJson(
      await GET(makeRequest("/api/budget?yearMonth=2026-11&currency=USD"), routeContext())
    );
    expect(status).toBe(200);
    expect(body).toEqual({ data: { yearMonth: "2026-11" } });
    expect(budgetService.getBudget).toHaveBeenCalledWith("u1", {
      yearMonth: "2026-11",
      currency: "USD",
      view: undefined,
    });
  });

  it("passes All through", async () => {
    vi.mocked(budgetService.getBudget).mockResolvedValue({ view: "all" } as never);
    await GET(makeRequest("/api/budget?view=all&yearMonth=2026-11"), routeContext());
    expect(budgetService.getBudget).toHaveBeenCalledWith("u1", {
      yearMonth: "2026-11",
      currency: undefined,
      view: "all",
    });
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await GET(makeRequest("/api/budget"), routeContext())).status).toBe(401);
  });
});

describe("PUT /api/budget", () => {
  const put = (body: unknown) => PUT(makeRequest("/api/budget", { method: "PUT", body }), routeContext());

  it("saves an expected amount", async () => {
    vi.mocked(budgetService.upsertExpected).mockResolvedValue({ hasPlan: true } as never);
    const payload = { yearMonth: "2026-11", currency: "USD", categoryId: "food", expectedAmount: 80 };
    const { status, body } = await readJson(await put(payload));
    expect(status).toBe(200);
    expect(body).toEqual({ data: { hasPlan: true } });
    expect(budgetService.upsertExpected).toHaveBeenCalledWith("u1", payload);
  });

  it("answers 400 when the service refuses the amount", async () => {
    vi.mocked(budgetService.upsertExpected).mockRejectedValue(new ValidationError("Expected amount must be zero or more."));
    expect((await put({ expectedAmount: -1 })).status).toBe(400);
  });
});
