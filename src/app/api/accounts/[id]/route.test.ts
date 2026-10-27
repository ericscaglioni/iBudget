import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({ accountService: { updateAccount: vi.fn(), deleteAccount: vi.fn() } }));

import { auth } from "@clerk/nextjs/server";
import { accountService } from "@/lib/server/services";
import { DELETE, PATCH } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const patch = (body: unknown) => PATCH(makeRequest("/api/accounts/a1", { method: "PATCH", body }), routeContext({ id: "a1" }));
const remove = () => DELETE(makeRequest("/api/accounts/a1", { method: "DELETE" }), routeContext({ id: "a1" }));

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("PATCH /api/accounts/[id]", () => {
  it("updates the user's account, passing only the fields an account has", async () => {
    vi.mocked(accountService.updateAccount).mockResolvedValue({ id: "a1", name: "New" } as never);
    const data = { name: "New", type: "checking", currency: "USD", initialBalance: 5 };

    const { status, body } = await readJson(await patch({ ...data, userId: "someone-else", id: "other" }));

    expect(status).toBe(200);
    expect(body).toEqual({ data: { id: "a1", name: "New" } });
    expect(accountService.updateAccount).toHaveBeenCalledWith("u1", "a1", data);
  });

  it("answers 404 for an account that is not the user's", async () => {
    vi.mocked(accountService.updateAccount).mockRejectedValue(new NotFoundError("Account"));
    const { status, body } = await readJson(await patch({ name: "New" }));
    expect(status).toBe(404);
    expect(body).toMatchObject({ error: { message: "Account not found" } });
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await patch({})).status).toBe(401);
    expect(accountService.updateAccount).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/accounts/[id]", () => {
  it("deletes the user's account", async () => {
    vi.mocked(accountService.deleteAccount).mockResolvedValue({ message: "Account deleted successfully" });
    const { status, body } = await readJson(await remove());
    expect(status).toBe(200);
    expect(body).toEqual({ data: { message: "Account deleted successfully" } });
    expect(accountService.deleteAccount).toHaveBeenCalledWith("u1", "a1");
  });

  it("explains why an account with transactions cannot be deleted", async () => {
    vi.mocked(accountService.deleteAccount).mockRejectedValue(new ValidationError("Cannot delete account with existing transactions"));
    const { status, body } = await readJson(await remove());
    expect(status).toBe(400);
    expect(body).toMatchObject({ error: { message: "Cannot delete account with existing transactions" } });
  });

  it("answers 404 for an account that is not the user's", async () => {
    vi.mocked(accountService.deleteAccount).mockRejectedValue(new NotFoundError("Account"));
    expect((await remove()).status).toBe(404);
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await remove()).status).toBe(401);
    expect(accountService.deleteAccount).not.toHaveBeenCalled();
  });
});
