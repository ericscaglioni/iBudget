import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { verify } = vi.hoisted(() => ({ verify: vi.fn() }));

vi.mock("svix", () => ({
  Webhook: class {
    verify = (body: string, headers: Record<string, string>) => verify(body, headers);
  },
}));
vi.mock("@/lib/server/utils/initializeUserDefaults", () => ({
  initializeUserDefaults: vi.fn(),
  deleteUserData: vi.fn(),
}));

import { deleteUserData, initializeUserDefaults } from "@/lib/server/utils/initializeUserDefaults";
import { POST } from "./route";

const webhook = (headers: Record<string, string> = { "svix-id": "id1", "svix-timestamp": "123", "svix-signature": "sig" }) =>
  POST(new NextRequest("http://localhost/api/clerk/webhook", { method: "POST", body: '{"hello":"world"}', headers }));

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/clerk/webhook", () => {
  describe("signature", () => {
    it("is checked against the exact body and Clerk's headers", async () => {
      verify.mockReturnValue({ type: "user.created", data: { id: "u1" } });
      await webhook();
      expect(verify).toHaveBeenCalledWith('{"hello":"world"}', {
        "svix-id": "id1",
        "svix-timestamp": "123",
        "svix-signature": "sig",
      });
    });

    it("rejects an event that is not signed by Clerk, and does nothing", async () => {
      verify.mockImplementation(() => {
        throw new Error("bad signature");
      });
      const response = await webhook();
      expect(response.status).toBe(400);
      expect(initializeUserDefaults).not.toHaveBeenCalled();
      expect(deleteUserData).not.toHaveBeenCalled();
    });

    it("rejects it too when the verifier fails with something that is not an Error", async () => {
      verify.mockImplementation(() => {
        throw "nope";
      });
      expect((await webhook()).status).toBe(400);
    });

    it("rejects a request without the signature headers", async () => {
      verify.mockImplementation(() => {
        throw new Error("missing headers");
      });
      expect((await webhook({})).status).toBe(400);
      expect(verify).toHaveBeenCalledWith(expect.any(String), { "svix-id": "", "svix-timestamp": "", "svix-signature": "" });
    });
  });

  it("sets up the default categories when a user signs up", async () => {
    verify.mockReturnValue({ type: "user.created", data: { id: "u1" } });
    const response = await webhook();
    expect(response.status).toBe(200);
    expect(initializeUserDefaults).toHaveBeenCalledWith("u1");
  });

  it("deletes the user's data when the user is deleted", async () => {
    verify.mockReturnValue({ type: "user.deleted", data: { id: "u1" } });
    vi.mocked(deleteUserData).mockResolvedValue({ transactions: 3, accounts: 1, categories: 10, settings: 0, guide: 0 });

    const response = await webhook();

    expect(response.status).toBe(200);
    expect(deleteUserData).toHaveBeenCalledWith("u1");
    expect(await response.json()).toEqual({
      data: { message: "User deleted successfully", deleted: { transactions: 3, accounts: 1, categories: 10, settings: 0, guide: 0 } },
    });
  });

  it("acknowledges events it does not handle, so Clerk does not keep retrying", async () => {
    verify.mockReturnValue({ type: "session.created", data: { id: "u1" } });
    const response = await webhook();
    expect(response.status).toBe(200);
    expect(initializeUserDefaults).not.toHaveBeenCalled();
    expect(deleteUserData).not.toHaveBeenCalled();
  });

  it("answers 500 when handling fails, so Clerk retries", async () => {
    verify.mockReturnValue({ type: "user.created", data: { id: "u1" } });
    vi.mocked(initializeUserDefaults).mockRejectedValue(new Error("db down"));
    expect((await webhook()).status).toBe(500);
  });
});
