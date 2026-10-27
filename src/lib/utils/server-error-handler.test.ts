import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors/AppError";

// Next's notFound() and redirect() work by throwing, so the mocks do too
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { handleServerError } from "./server-error-handler";

describe("handleServerError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows the not-found page for a 404", () => {
    expect(() => handleServerError(new NotFoundError("Account"))).toThrow("NEXT_NOT_FOUND");
  });

  it("sends a 401 to the login page", () => {
    expect(() => handleServerError(new UnauthorizedError())).toThrow("NEXT_REDIRECT:/login");
  });

  it("rethrows other app errors for the error boundary", () => {
    const forbidden = new ForbiddenError();
    expect(() => handleServerError(forbidden)).toThrow(forbidden);
    const invalid = new ValidationError("bad");
    expect(() => handleServerError(invalid)).toThrow(invalid);
    expect(() => handleServerError(new AppError("boom"))).toThrow("boom");
  });

  it("uses the fallback for unexpected errors when there is one", () => {
    const fallback = vi.fn(() => {
      throw new Error("fallback ran");
    }) as () => never;
    expect(() => handleServerError(new Error("weird"), fallback)).toThrow("fallback ran");
    expect(fallback).toHaveBeenCalled();
  });

  it("rethrows unexpected errors without a fallback", () => {
    const error = new Error("weird");
    expect(() => handleServerError(error)).toThrow(error);
  });
});
