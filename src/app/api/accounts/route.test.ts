import { describe, expect, it, vi } from "vitest";
import { AppError, ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  accountService: { getAccountsByUser: vi.fn(), createAccount: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { accountService } from "@/lib/server/services";
import { GET, POST } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const signedIn = () => mockAuth.mockResolvedValue({ userId: "u1" });
const get = (path: string) => GET(makeRequest(path), routeContext());
const post = (body: unknown) => POST(makeRequest("/api/accounts", { method: "POST", body }), routeContext());

describe("GET /api/accounts", () => {
  it("returns the user's accounts, using the paging in the URL", async () => {
    signedIn();
    vi.mocked(accountService.getAccountsByUser).mockResolvedValue({ accounts: [], total: 0 });

    const { status, body } = await readJson(await get("/api/accounts?page=2&pageSize=50"));

    expect(status).toBe(200);
    expect(body).toEqual({ data: { accounts: [], total: 0 } });
    expect(accountService.getAccountsByUser).toHaveBeenCalledWith("u1", expect.objectContaining({ page: 2, pageSize: 50 }));
  });

  it("answers 401 when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await get("/api/accounts");
    expect(response.status).toBe(401);
    expect(accountService.getAccountsByUser).not.toHaveBeenCalled();
  });

  it("answers with the error's own status", async () => {
    signedIn();
    vi.mocked(accountService.getAccountsByUser).mockRejectedValue(new AppError("Nope", 418, "TEAPOT"));
    const { status, body } = await readJson(await get("/api/accounts"));
    expect(status).toBe(418);
    expect(body).toEqual({ error: { message: "Nope", code: "TEAPOT" } });
  });
});

describe("POST /api/accounts", () => {
  it("creates an account for the user and answers 201", async () => {
    signedIn();
    vi.mocked(accountService.createAccount).mockResolvedValue({ id: "a1" } as never);
    const data = { name: "Main", type: "checking", currency: "USD", initialBalance: 5 };

    const { status, body } = await readJson(await post(data));

    expect(status).toBe(201);
    expect(body).toEqual({ data: { id: "a1" } });
    expect(accountService.createAccount).toHaveBeenCalledWith("u1", data);
  });

  it("answers 400 when the data is not valid", async () => {
    signedIn();
    vi.mocked(accountService.createAccount).mockRejectedValue(new ValidationError("Missing required account data"));
    const { status } = await readJson(await post({}));
    expect(status).toBe(400);
  });

  it("creates nothing and answers 401 when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await post({})).status).toBe(401);
    expect(accountService.createAccount).not.toHaveBeenCalled();
  });
});
