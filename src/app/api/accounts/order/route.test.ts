import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({ accountService: { reorderAccounts: vi.fn() } }));

import { auth } from "@clerk/nextjs/server";
import { accountService } from "@/lib/server/services";
import { PUT } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const put = (body?: unknown) => PUT(makeRequest("/api/accounts/order", { method: "PUT", body }), routeContext());

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("PUT /api/accounts/order", () => {
  it("saves the order the user sent", async () => {
    const { status, body } = await readJson(await put({ accountIds: ["b", "a"] }));

    expect(status).toBe(200);
    expect(body).toEqual({ data: { message: "Accounts reordered successfully" } });
    expect(accountService.reorderAccounts).toHaveBeenCalledWith("u1", ["b", "a"]);
  });

  it("passes on a missing list so the service can reject it", async () => {
    vi.mocked(accountService.reorderAccounts).mockRejectedValue(new ValidationError("Send the accounts to order as a list of ids"));
    const { status } = await readJson(await put({}));
    expect(accountService.reorderAccounts).toHaveBeenCalledWith("u1", undefined);
    expect(status).toBe(400);
  });

  it("answers 404 for an account that is not the user's", async () => {
    vi.mocked(accountService.reorderAccounts).mockRejectedValue(new NotFoundError("Account"));
    const { status } = await readJson(await put({ accountIds: ["x"] }));
    expect(status).toBe(404);
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await put({ accountIds: ["a"] })).status).toBe(401);
    expect(accountService.reorderAccounts).not.toHaveBeenCalled();
  });
});
