import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  budgetService: { copyPreviousMonth: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { budgetService } from "@/lib/server/services";
import { POST } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("POST /api/budget/copy", () => {
  const post = (body: unknown) => POST(makeRequest("/api/budget/copy", { method: "POST", body }), routeContext());

  it("copies the previous plan", async () => {
    vi.mocked(budgetService.copyPreviousMonth).mockResolvedValue({ hasPlan: true } as never);
    const { status } = await readJson(await post({ yearMonth: "2026-11", currency: "USD" }));
    expect(status).toBe(200);
    expect(budgetService.copyPreviousMonth).toHaveBeenCalledWith("u1", {
      yearMonth: "2026-11",
      currency: "USD",
      view: undefined,
      overwrite: false,
    });
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await post({})).status).toBe(401);
  });
});
