import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({ guideService: { dismissTip: vi.fn() } }));

import { auth } from "@clerk/nextjs/server";
import { guideService } from "@/lib/server/services";
import { POST } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const post = (body: unknown) => POST(makeRequest("/api/guide/dismiss", { method: "POST", body }), routeContext());

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("POST /api/guide/dismiss", () => {
  it("dismisses the tip and says which one", async () => {
    const { status, body } = await readJson(await post({ tipId: "checklist" }));
    expect(status).toBe(200);
    expect(body).toEqual({ data: { tipId: "checklist" } });
    expect(guideService.dismissTip).toHaveBeenCalledWith("u1", "checklist");
  });

  it("answers 400 for a tip that does not exist", async () => {
    vi.mocked(guideService.dismissTip).mockRejectedValue(new ValidationError("Unknown tip"));
    expect((await post({ tipId: "nope" })).status).toBe(400);
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await post({ tipId: "checklist" })).status).toBe(401);
    expect(guideService.dismissTip).not.toHaveBeenCalled();
  });
});
