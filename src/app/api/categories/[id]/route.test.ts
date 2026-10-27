import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({ categoryService: { updateCategory: vi.fn(), deleteCategory: vi.fn() } }));

import { auth } from "@clerk/nextjs/server";
import { categoryService } from "@/lib/server/services";
import { DELETE, PATCH } from "./route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const patch = (body: unknown) => PATCH(makeRequest("/api/categories/c1", { method: "PATCH", body }), routeContext({ id: "c1" }));
const remove = () => DELETE(makeRequest("/api/categories/c1", { method: "DELETE" }), routeContext({ id: "c1" }));

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("PATCH /api/categories/[id]", () => {
  it("updates the user's category, passing only the fields a category has", async () => {
    vi.mocked(categoryService.updateCategory).mockResolvedValue({ id: "c1", name: "New" } as never);
    const data = { name: "New", color: "#000", type: "income" };

    const { status, body } = await readJson(await patch({ ...data, userId: "someone-else" }));

    expect(status).toBe(200);
    expect(body).toEqual({ data: { id: "c1", name: "New" } });
    expect(categoryService.updateCategory).toHaveBeenCalledWith("u1", "c1", data);
  });

  it("answers 404 for a category that is not the user's", async () => {
    vi.mocked(categoryService.updateCategory).mockRejectedValue(new NotFoundError("Category"));
    expect((await patch({ name: "New" })).status).toBe(404);
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await patch({})).status).toBe(401);
    expect(categoryService.updateCategory).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/categories/[id]", () => {
  it("deletes the user's category", async () => {
    vi.mocked(categoryService.deleteCategory).mockResolvedValue({ message: "Category deleted successfully" });
    const { status, body } = await readJson(await remove());
    expect(status).toBe(200);
    expect(body).toEqual({ data: { message: "Category deleted successfully" } });
    expect(categoryService.deleteCategory).toHaveBeenCalledWith("u1", "c1");
  });

  it("explains why a category with transactions cannot be deleted", async () => {
    vi.mocked(categoryService.deleteCategory).mockRejectedValue(new ValidationError("Cannot delete category with existing transactions"));
    const { status, body } = await readJson(await remove());
    expect(status).toBe(400);
    expect(body).toMatchObject({ error: { message: "Cannot delete category with existing transactions" } });
  });

  it("answers 404 for a category that is not the user's", async () => {
    vi.mocked(categoryService.deleteCategory).mockRejectedValue(new NotFoundError("Category"));
    expect((await remove()).status).toBe(404);
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await remove()).status).toBe(401);
    expect(categoryService.deleteCategory).not.toHaveBeenCalled();
  });
});
