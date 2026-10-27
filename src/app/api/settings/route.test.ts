import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({ settingsService: { getSettings: vi.fn(), updateSettings: vi.fn() } }));

import { auth } from "@clerk/nextjs/server";
import { settingsService } from "@/lib/server/services";
import { GET, PATCH } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("GET /api/settings", () => {
  it("returns the user's settings", async () => {
    vi.mocked(settingsService.getSettings).mockResolvedValue({ defaultCurrency: "USD" } as never);
    const { status, body } = await readJson(await GET(makeRequest("/api/settings"), routeContext()));
    expect(status).toBe(200);
    expect(body).toEqual({ data: { defaultCurrency: "USD" } });
    expect(settingsService.getSettings).toHaveBeenCalledWith("u1");
  });

  it("answers 500 when something unexpected breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(settingsService.getSettings).mockRejectedValue(new Error("boom"));
    expect((await GET(makeRequest("/api/settings"), routeContext())).status).toBe(500);
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await GET(makeRequest("/api/settings"), routeContext())).status).toBe(401);
  });
});

describe("PATCH /api/settings", () => {
  const patch = (body: unknown) => PATCH(makeRequest("/api/settings", { method: "PATCH", body }), routeContext());

  it("saves what the user sent", async () => {
    vi.mocked(settingsService.updateSettings).mockResolvedValue({ defaultCurrency: "EUR" } as never);
    const { status, body } = await readJson(await patch({ defaultCurrency: "EUR" }));
    expect(status).toBe(200);
    expect(body).toEqual({ data: { defaultCurrency: "EUR" } });
    expect(settingsService.updateSettings).toHaveBeenCalledWith("u1", { defaultCurrency: "EUR" });
  });

  it("answers 400 for a currency the user cannot pick", async () => {
    vi.mocked(settingsService.updateSettings).mockRejectedValue(new ValidationError("nope"));
    expect((await patch({ defaultCurrency: "JPY" })).status).toBe(400);
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await patch({})).status).toBe(401);
    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });
});
