import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, readJson, routeContext } from "@/test/http";
import type { PrismaMock } from "@/test/mock-prisma";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", async () => {
  const { createPrismaMock } = await import("@/test/mock-prisma");
  return { prisma: createPrismaMock() };
});

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DELETE, PATCH } from "./route";

const db = prisma as unknown as PrismaMock;
const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("PATCH /api/categories/[id]", () => {
  it("updates only the user's own category", async () => {
    db.category.update.mockResolvedValue({ id: "c1", name: "New" });
    const data = { name: "New", color: "#000", type: "income" };

    const { status, body } = await readJson(
      await PATCH(makeRequest("/api/categories/c1", { method: "PATCH", body: data }), routeContext({ id: "c1" }))
    );

    expect(status).toBe(200);
    expect(body).toEqual({ id: "c1", name: "New" });
    expect(db.category.update).toHaveBeenCalledWith({ where: { id: "c1", userId: "u1" }, data });
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await PATCH(makeRequest("/api/categories/c1", { method: "PATCH", body: {} }), routeContext({ id: "c1" }));
    expect(response.status).toBe(401);
    expect(db.category.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/categories/[id]", () => {
  it("deletes only the user's own category", async () => {
    const { status, body } = await readJson(
      await DELETE(makeRequest("/api/categories/c1", { method: "DELETE" }), routeContext({ id: "c1" }))
    );
    expect(status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: "c1", userId: "u1" } });
  });

  it("is refused when nobody is signed in", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await DELETE(makeRequest("/api/categories/c1", { method: "DELETE" }), routeContext({ id: "c1" }));
    expect(response.status).toBe(401);
    expect(db.category.delete).not.toHaveBeenCalled();
  });
});
