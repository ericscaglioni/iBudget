import { dashboardService } from "@/lib/server/services";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api-response";
import { authHandler } from "@/lib/middlewares";

export const GET = authHandler(async ({ userId }) => {
  try {
    const result = await dashboardService.getAccountOverview(userId);
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error);
  }
});

