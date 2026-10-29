import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRequest, readJson, routeContext } from "@/test/http";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/server/services", () => ({
  dashboardService: {
    getDashboardData: vi.fn(),
    getAccountBalances: vi.fn(),
    getMonthlySummary: vi.fn(),
    getAccountOverview: vi.fn(),
  },
}));

import { auth } from "@clerk/nextjs/server";
import { dashboardService } from "@/lib/server/services";
import { GET as getDashboard } from "./route";
import { GET as getAccounts } from "./accounts/route";
import { GET as getMonthly } from "./monthly/route";
import { GET as getOverview } from "./overview/route";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const call = (handler: typeof getDashboard, path: string) => handler(makeRequest(path), routeContext());

beforeEach(() => mockAuth.mockResolvedValue({ userId: "u1" }));

describe("GET /api/dashboard", () => {
  it("returns the dashboard with everything included by default", async () => {
    vi.mocked(dashboardService.getDashboardData).mockResolvedValue({ currency: "USD" } as never);

    const { status, body } = await readJson(await call(getDashboard, "/api/dashboard"));

    expect(status).toBe(200);
    expect(body).toEqual({ data: { currency: "USD" } });
    expect(dashboardService.getDashboardData).toHaveBeenCalledWith("u1", {
      includeCurrentMonth: true,
      includePreviousMonth: true,
      month: undefined,
      currency: undefined,
      view: undefined,
    });
  });

  it("passes the options in the URL on", async () => {
    await call(getDashboard, "/api/dashboard?includeCurrentMonth=false&includePreviousMonth=false&month=2026-05&currency=EUR");
    expect(dashboardService.getDashboardData).toHaveBeenCalledWith("u1", {
      includeCurrentMonth: false,
      includePreviousMonth: false,
      month: "2026-05",
      currency: "EUR",
      view: undefined,
    });
  });

  it("answers 500 when something unexpected breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(dashboardService.getDashboardData).mockRejectedValue(new Error("boom"));
    expect((await call(getDashboard, "/api/dashboard")).status).toBe(500);
  });

  it("passes the All view on", async () => {
    await call(getDashboard, "/api/dashboard?view=all");
    expect(dashboardService.getDashboardData).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ view: "all" })
    );
  });
});

describe("GET /api/dashboard/accounts", () => {
  it("returns the balances", async () => {
    vi.mocked(dashboardService.getAccountBalances).mockResolvedValue({ accountBalances: [] } as never);
    const { status, body } = await readJson(await call(getAccounts, "/api/dashboard/accounts"));
    expect(status).toBe(200);
    expect(body).toEqual({ data: { accountBalances: [] } });
    expect(dashboardService.getAccountBalances).toHaveBeenCalledWith("u1");
  });

  it("answers 500 when something unexpected breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(dashboardService.getAccountBalances).mockRejectedValue(new Error("boom"));
    expect((await call(getAccounts, "/api/dashboard/accounts")).status).toBe(500);
  });
});

describe("GET /api/dashboard/monthly", () => {
  it("returns the summary of the month asked for", async () => {
    vi.mocked(dashboardService.getMonthlySummary).mockResolvedValue({ income: 1 } as never);
    const { body } = await readJson(await call(getMonthly, "/api/dashboard/monthly?month=2026-09"));
    expect(body).toEqual({ data: { income: 1 } });
    expect(dashboardService.getMonthlySummary).toHaveBeenCalledWith("u1", "2026-09");
  });

  it("uses the current month when none is given", async () => {
    await call(getMonthly, "/api/dashboard/monthly");
    expect(dashboardService.getMonthlySummary).toHaveBeenCalledWith("u1", undefined);
  });

  it("answers 500 when something unexpected breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(dashboardService.getMonthlySummary).mockRejectedValue(new Error("boom"));
    expect((await call(getMonthly, "/api/dashboard/monthly")).status).toBe(500);
  });
});

describe("GET /api/dashboard/overview", () => {
  it("returns the overview", async () => {
    vi.mocked(dashboardService.getAccountOverview).mockResolvedValue({ sixMonthSummary: [] } as never);
    const { body } = await readJson(await call(getOverview, "/api/dashboard/overview"));
    expect(body).toEqual({ data: { sixMonthSummary: [] } });
    expect(dashboardService.getAccountOverview).toHaveBeenCalledWith("u1");
  });

  it("answers 500 when something unexpected breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(dashboardService.getAccountOverview).mockRejectedValue(new Error("boom"));
    expect((await call(getOverview, "/api/dashboard/overview")).status).toBe(500);
  });
});

describe("all dashboard routes", () => {
  it.each([
    ["dashboard", getDashboard],
    ["accounts", getAccounts],
    ["monthly", getMonthly],
    ["overview", getOverview],
  ])("refuse a visitor who is not signed in (%s)", async (_name, handler) => {
    mockAuth.mockResolvedValue({ userId: null });
    expect((await call(handler, "/api/dashboard")).status).toBe(401);
  });
});
