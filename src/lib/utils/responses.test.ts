import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors/AppError";
import { createErrorResponse, createSuccessResponse } from "./api-response";

describe("createSuccessResponse", () => {
  it("wraps the data, with a 200 by default", async () => {
    const response = createSuccessResponse({ id: 1 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: 1 } });
  });

  it("uses the given status", async () => {
    const response = createSuccessResponse({ id: 1 }, 201);
    expect(response.status).toBe(201);
  });
});

describe("createErrorResponse", () => {
  afterEach(() => vi.restoreAllMocks());

  it("turns an AppError into its status, message and code", async () => {
    const response = createErrorResponse(new NotFoundError("Account"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { message: "Account not found", code: "NOT_FOUND" } });

    const validation = createErrorResponse(new ValidationError("bad"));
    expect(validation.status).toBe(400);
    expect(createErrorResponse(new AppError("custom", 409)).status).toBe(409);
  });

  it("hides the details of anything unexpected", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = createErrorResponse(new Error("database password is hunter2"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: { message: "An unexpected error occurred", code: "INTERNAL_SERVER_ERROR" } });
    expect(JSON.stringify(body)).not.toContain("hunter2");
    expect(log).toHaveBeenCalled();
  });
});
