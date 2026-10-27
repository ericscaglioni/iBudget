import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  categoryService: { getUserCategories: vi.fn(), createCategory: vi.fn() },
}));

import { auth } from "@clerk/nextjs/server";
import { categoryService } from "@/lib/server/services";
import { GET, POST } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const signedIn = () => mockAuth.mockResolvedValue({ userId: "u1" });

describe("GET /api/categories", () => {
  it("returns the user's categories", async () => {
    signedIn();
    vi.mocked(categoryService.getUserCategories).mockResolvedValue([{ id: "c1" }] as never);
    const { status, body } = await readJson(await GET());
    expect(status).toBe(200);
    expect(body).toEqual({ data: [{ id: "c1" }] });
    expect(categoryService.getUserCategories).toHaveBeenCalledWith("u1");
  });

  it("does not return anything when nobody is signed in", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockAuth.mockResolvedValue({ userId: null });
    expect((await GET()).status).toBeGreaterThanOrEqual(400);
    expect(categoryService.getUserCategories).not.toHaveBeenCalled();
  });

  it("turns an unexpected failure into a 500 without leaking details", async () => {
    signedIn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(categoryService.getUserCategories).mockRejectedValue(new Error("db password is hunter2"));
    const { status, body } = await readJson(await GET());
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("hunter2");
  });
});

describe("POST /api/categories", () => {
  it("creates a category for the user and answers 201", async () => {
    signedIn();
    vi.mocked(categoryService.createCategory).mockResolvedValue({ id: "c1" } as never);
    const data = { name: "Food", color: "#fff", type: "expense" };
    const { status, body } = await readJson(await POST(makeRequest("/api/categories", { method: "POST", body: data })));
    expect(status).toBe(201);
    expect(body).toEqual({ data: { id: "c1" } });
    expect(categoryService.createCategory).toHaveBeenCalledWith("u1", data);
  });

  it("answers 400 when the data is not valid", async () => {
    signedIn();
    vi.mocked(categoryService.createCategory).mockRejectedValue(new ValidationError("Missing required category data"));
    const { status } = await readJson(await POST(makeRequest("/api/categories", { method: "POST", body: {} })));
    expect(status).toBe(400);
  });

  it("creates nothing when nobody is signed in", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockAuth.mockResolvedValue({ userId: null });
    const { status } = await readJson(await POST(makeRequest("/api/categories", { method: "POST", body: {} })));
    expect(status).toBeGreaterThanOrEqual(400);
    expect(categoryService.createCategory).not.toHaveBeenCalled();
  });
});
