import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/AppError";
import * as client from "./client";
import * as server from "./server";

const fetchMock = vi.fn();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://ibudget.test");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("api client", () => {
  it("get returns the data of a successful response", async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 1 } }));
    await expect(client.get("/api/x")).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith("/api/x");
  });

  it("post sends JSON to the full URL on the server", async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 1 } }, 201));

    await expect(client.post("/api/x", { a: 1 })).resolves.toEqual({ id: 1 });

    expect(fetchMock).toHaveBeenCalledWith("https://ibudget.test/api/x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it.each([
    ["patch", "PATCH"],
    ["put", "PUT"],
  ] as const)("%s sends JSON with the right method", async (name, method) => {
    fetchMock.mockResolvedValue(json({ data: "ok" }));

    await expect(client[name]("/api/x/1", { a: 1 })).resolves.toBe("ok");

    expect(fetchMock).toHaveBeenCalledWith("/api/x/1", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it("del sends a DELETE, and a 204 answer has no data", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(client.del("/api/x/1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/x/1", { method: "DELETE" });
  });

  it("turns an error answer into an AppError with the server's message, status and code", async () => {
    fetchMock.mockResolvedValue(json({ error: { message: "Account not found", code: "NOT_FOUND" } }, 404));

    const failure = await client.get("/api/x").catch((error) => error);

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ message: "Account not found", statusCode: 404, code: "NOT_FOUND" });
  });

  it("treats an error body as a failure even when the status says OK", async () => {
    fetchMock.mockResolvedValue(json({ error: { message: "Nope" } }, 200));
    await expect(client.get("/api/x")).rejects.toThrow("Nope");
  });

  it.each(["get", "del"] as const)("%s lets a network failure through", async (name) => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(client[name]("/api/x")).rejects.toThrow("offline");
  });

  it.each(["post", "patch", "put"] as const)("%s lets a network failure through", async (name) => {
    fetchMock.mockRejectedValue(new Error("offline"));
    await expect(client[name]("/api/x", {})).rejects.toThrow("offline");
  });
});

describe("api server", () => {
  it("posts JSON, merging any extra headers, and returns the parsed body", async () => {
    fetchMock.mockResolvedValue(json({ done: true }));

    const result = await server.post("/api/x", { a: 1 }, { Authorization: "Bearer t" });

    expect(result).toEqual({ done: true });
    expect(fetchMock).toHaveBeenCalledWith("https://ibudget.test/api/x", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer t" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it("throws with the body of a failed answer", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(server.post("/api/x", {})).rejects.toThrow("POST /api/x failed: boom");
  });
});
