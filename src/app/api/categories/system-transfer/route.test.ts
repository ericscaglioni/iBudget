import { describe, expect, it, vi } from "vitest";
import { readJson } from "@/test/http";

vi.mock("@/lib/server/services", () => ({ categoryService: { getSystemTransferCategory: vi.fn() } }));

import { categoryService } from "@/lib/server/services";
import { GET } from "./route";

describe("GET /api/categories/system-transfer", () => {
  it("returns the Transfer category", async () => {
    vi.mocked(categoryService.getSystemTransferCategory).mockResolvedValue({ id: "t" } as never);
    const { status, body } = await readJson(await GET());
    expect(status).toBe(200);
    expect(body).toEqual({ data: { id: "t" } });
  });

  it("answers 500 when it does not exist", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(categoryService.getSystemTransferCategory).mockRejectedValue(new Error("Transfer category not found"));
    expect((await GET()).status).toBe(500);
  });
});
