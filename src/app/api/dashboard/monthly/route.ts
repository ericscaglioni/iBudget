import { dashboardService } from "@/lib/server/services";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { authHandler } from "@/lib/middlewares";

export const GET = authHandler(async ({ userId, request }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");

    const result = await dashboardService.getMonthlySummary(userId, month || undefined);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});

