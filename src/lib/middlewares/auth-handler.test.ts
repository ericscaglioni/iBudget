import { describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { makeRequest, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { authHandler } from "./auth-handler";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

describe("authHandler", () => {
  it("answers 401 and never runs the handler when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const handler = vi.fn();

    const response = await authHandler(handler)(makeRequest("/api/x"), routeContext());

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
    expect(handler).not.toHaveBeenCalled();
  });

  it("gives the handler the user, the request and the URL parameters", async () => {
    mockAuth.mockResolvedValue({ userId: "u1" });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const request = makeRequest("/api/x/42");
    const context = routeContext({ id: "42" });

    const response = await authHandler(handler)(request, context);

    expect(handler).toHaveBeenCalledWith({ userId: "u1", request, params: context.params });
    expect(await response.json()).toEqual({ ok: true });
  });
});
