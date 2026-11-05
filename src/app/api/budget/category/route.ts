import { authHandler } from "@/lib/middlewares";
import { budgetService } from "@/lib/server/services";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-response";

export const GET = authHandler(async ({ userId, request }) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId") ?? "";
    const yearMonth = searchParams.get("yearMonth") ?? "";
    const currency = searchParams.get("currency") ?? "";
    return createSuccessResponse(
      await budgetService.getCategoryStatus(userId, { categoryId, yearMonth, currency })
    );
  } catch (error) {
    return createErrorResponse(error);
  }
});
