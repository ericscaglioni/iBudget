import { dashboardService } from "@/lib/server/services";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { authHandler } from "@/lib/middlewares";

export const GET = authHandler(async ({ userId, request }) => {
  try {
    // Parse optional query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeCurrentMonth = searchParams.get("includeCurrentMonth") !== "false";
    const includePreviousMonth = searchParams.get("includePreviousMonth") !== "false";
    const month = searchParams.get("month");
    const currency = searchParams.get("currency");
    const view = searchParams.get("view") === "all" ? "all" as const : undefined;

    const result = await dashboardService.getDashboardData(userId, {
      includeCurrentMonth,
      includePreviousMonth,
      month: month || undefined,
      currency: currency || undefined,
      view,
    });

    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});

