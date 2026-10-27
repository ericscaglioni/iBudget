import { describe, expect, it } from "vitest";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "./AppError";

describe("AppError", () => {
  it("defaults to a 500 with no code", () => {
    const error = new AppError("boom");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("boom");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.name).toBe("AppError");
  });

  it("keeps a custom status and code", () => {
    const error = new AppError("nope", 418, "TEAPOT");
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("TEAPOT");
  });

  it.each([
    [new ValidationError("bad input"), "bad input", 400, "VALIDATION_ERROR", "ValidationError"],
    [new NotFoundError("Account"), "Account not found", 404, "NOT_FOUND", "NotFoundError"],
    [new UnauthorizedError(), "Unauthorized access", 401, "UNAUTHORIZED", "UnauthorizedError"],
    [new UnauthorizedError("log in"), "log in", 401, "UNAUTHORIZED", "UnauthorizedError"],
    [new ForbiddenError(), "Access forbidden", 403, "FORBIDDEN", "ForbiddenError"],
    [new ForbiddenError("not yours"), "not yours", 403, "FORBIDDEN", "ForbiddenError"],
  ])("%o maps to its status and code", (error, message, status, code, name) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(status);
    expect(error.code).toBe(code);
    expect(error.name).toBe(name);
  });
});
